"use client";

import { useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { useGenProofVerify } from "@/hooks/genProofVerify";
import { deriveMaciKeypair, getStateIndexFromChain } from "@/lib/maci-key-derivation";
import { useAccount, useSignTypedData, usePublicClient, useChainId } from "wagmi";
import { useVerifyVote } from "@/hooks/useVerifyVote";
import { useRewards } from "@/hooks/useRewards";
import { useClaimContract } from "@/hooks/useClaimContract";
import { useMaci } from "@/hooks/useMACI";

// @ts-ignore
import * as snarkjs from "snarkjs";

interface PrizeClaimFormProps {
  pollId: string;
  maciAddress?: string;
  startBlock?: number;
}

export function PrizeClaimForm({ pollId, maciAddress, startBlock }: PrizeClaimFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inputs for proof generation
  // Ideally these should come from history or user input if not stored
  const [voteOptionIndex, setVoteOptionIndex] = useState("");
  const [voteWeight, setVoteWeight] = useState("");
  const [nonce, setNonce] = useState("0");
  const [password, setPassword] = useState(""); // User manual password
  const [pollAddress, setPollAddress] = useState<string | null>(null);
  const { generateVoteProof, verifyProof } = useGenProofVerify();
  const { verifyVote } = useVerifyVote();
  const { saveReward } = useRewards();
  const { claimReward } = useClaimContract();
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { checkPollStatus } = useMaci();

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log("maciAddress", maciAddress);
    try {
      if (!address) throw new Error("Wallet not connected");
      if (!voteOptionIndex || !voteWeight) throw new Error("Please fill in vote details");
      if (!password) throw new Error("Please enter your secret password");

      // 1. Derive Keys (still needed for pubKeyX/Y inputs and state index lookup)
      console.log("Deriving MACI keypair...");
      const { pubKeyX, pubKeyY } = await deriveMaciKeypair(
        address,
        chainId,
        signTypedDataAsync,
        { maciAddress }
      );
      const poll = await checkPollStatus(pollId, maciAddress);
      if (!poll || !poll.pollAddress) {
        
      }
      // 2. Get State Index
      console.log("Fetching stateIndex...");
      const { stateIndex } = await getStateIndexFromChain(
        maciAddress || "",
        { x: pubKeyX, y: pubKeyY },
        publicClient,
        startBlock
      );

      // if (!stateIndex) throw new Error("State index not found. Did you signup?");

      // 3. Calculate Commitment using PASSWORD
      // @ts-ignore
      const circomlibjs = await import("circomlibjs");
      const poseidon = await circomlibjs.buildPoseidon();

      // Assume password is numeric string
      let passwordBigInt;
      try {
        passwordBigInt = BigInt(password);
      } catch (e) {
        throw new Error("Password must be numeric");
      }

      const voteNum = BigInt(voteOptionIndex);
      const weightNum = BigInt(voteWeight);
      const nonceNum = BigInt(nonce); // Use nonce from input, not hardcoded
      const pollAddressNum = BigInt(poll.pollAddress);

      console.log("Generating vote commitment with:", {
        voteOptionIndex,
        voteWeight,
        nonce,
        pollAddress:poll.pollAddress,
        password
      });

      const voteCommitment = poseidon.F.toString(poseidon([
        voteNum,
        weightNum,
        nonceNum,
        pollAddressNum,
        passwordBigInt // Use password here
      ]));
      console.log("Calculated voteCommitment:", voteCommitment);
      // 3.1. Verify voteCommitment against DB
      console.log("Verifying voteCommitment with DB...");
      const { pollParticipantsApi } = await import("@/api/join-poll.api");
      const votes = await pollParticipantsApi.getAll(poll.pollAddress, address);

      // Find the vote record for this user
      const voteRecord = Array.isArray(votes)
        ? votes.find((v: any) => v.voterAddress?.toLowerCase() === address?.toLowerCase())
        : votes;

      if (!voteRecord) {
        throw new Error("Vote record not found. Did you cast a vote?");
      }

      console.log("Vote record from DB:", votes);
      const storedCommitment = voteRecord.voteCommitment;
      if (!storedCommitment) {
        throw new Error("Vote commitment not found in DB record");
      }

      if (storedCommitment !== voteCommitment) {
        console.error("Commitment mismatch:", { calculated: voteCommitment, stored: storedCommitment });
        throw new Error("Vote commitment mismatch! Password or vote details are incorrect.");
      }

      console.log("✅ Vote commitment verified successfully!");

      // 4. Generate Proof
      const input = {
        privateKey: passwordBigInt, // Use password here as 'privateKey' for circuit
        vote: voteNum,
        voiceCredits: weightNum,
        nonce: nonceNum,
        pollId: pollAddressNum,
        pubkeyX: BigInt(pubKeyX),
        pubkeyY: BigInt(pubKeyY),
        voiceCreditBalance: weightNum * weightNum, // Minimal to pass
        voterIndex: BigInt(stateIndex || 1),
        voteCommitment: BigInt(voteCommitment),
        outcome: voteNum // Must equal vote for circuit constraint
      };

      console.log("Generating proof with input:", input);
      const proofData = await generateVoteProof(input);

      const isValid = await verifyProof(proofData.proof, proofData.publicSignals);
      console.log("Proof validity:", proofData);
      if (isValid) {
        const proof = convertProofToSolidityFormat(proofData.proof);
        await verifyVote(BigInt(pollId), BigInt(stateIndex || 1), proof, proofData.publicSignals);

        const res = await saveReward(address, pollId, Number(voteWeight));
        if (!res || !res._idClaim || !res.amountToken) {
          throw new Error("Invalid reward response from backend");
        }

        // Validate signature components exist
        if (res._v === undefined || !res._r || !res._s) {
          console.error("Missing signature components:", { _v: res._v, _r: res._r, _s: res._s });
          throw new Error("Missing signature components from backend response");
        }

        await claimReward(
          String(res._idClaim),
          String(res.amountToken),
          Number(res._v),
          String(res._r),
          String(res._s)
        );
        setSuccess("Reward claimed successfully! 🎉");
      }


    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate proof");
    } finally {
      setLoading(false);
    }
  };

  function convertProofToSolidityFormat(proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  }): [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
    const proofArray: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [

      BigInt(proof.pi_a[0]!),
      BigInt(proof.pi_a[1]!),

      BigInt(proof.pi_b[0]![0]!),
      BigInt(proof.pi_b[0]![1]!),
      BigInt(proof.pi_b[1]![0]!),
      BigInt(proof.pi_b[1]![1]!),

      BigInt(proof.pi_c[0]!),
      BigInt(proof.pi_c[1]!)
    ];

    return proofArray;
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 mt-6">
      <h3 className="text-xl font-bold mb-4">Claim Prize</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vote Option Index</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={voteOptionIndex}
            onChange={(e) => setVoteOptionIndex(e.target.value)}
            placeholder="e.g. 0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vote Weight</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={voteWeight}
            onChange={(e) => setVoteWeight(e.target.value)}
            placeholder="e.g. 9"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nonce</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            placeholder="e.g. 0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Secret Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your secret code"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button
          onClick={handleClaim}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Generating Proof..." : "Generate Proof & Claim"}
        </Button>
      </div>
    </div>
  );
}
