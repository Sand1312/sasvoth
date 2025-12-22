"use client";

import { useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { useGenProofVerify } from "@/hooks/genProofVerify";
import { useMaci } from "@/hooks/useMACI";
import { deriveMaciKeypair, getStateIndexFromChain } from "@/utils/maciKeyDerivation";
import { useAccount, useSignTypedData, usePublicClient, useChainId } from "wagmi";

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

  const { generateVoteProof } = useGenProofVerify();
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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

      // 2. Get State Index
      console.log("Fetching stateIndex...");
      const { stateIndex } = await getStateIndexFromChain(
        maciAddress || "", 
        { x: pubKeyX, y: pubKeyY },
        publicClient,
        startBlock
      );

      if (!stateIndex) throw new Error("State index not found. Did you signup?");

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
      const nonceNum = BigInt(nonce);
      const pollIdNum = BigInt(pollId);

      const voteCommitment = poseidon.F.toString(poseidon([
          voteNum,
          weightNum,
          nonceNum,
          pollIdNum,
          passwordBigInt // Use password here
      ]));

      // 4. Generate Proof
      const input = {
          privateKey: passwordBigInt, // Use password here as 'privateKey' for circuit
          vote: voteNum,
          voiceCredits: weightNum,
          nonce: nonceNum,
          pollId: pollIdNum,
          pubkeyX: BigInt(pubKeyX),
          pubkeyY: BigInt(pubKeyY),
          voiceCreditBalance: weightNum * weightNum, // Minimal to pass
          voterIndex: BigInt(stateIndex),
          voteCommitment: BigInt(voteCommitment),
          outcome: BigInt(0)
      };

      console.log("Generating proof with input:", input);
      const proofData = await generateVoteProof(input);
      
      console.log("Proof generated:", proofData);
      setSuccess("Proof generated successfully! You can now claim your prize.");
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate proof");
    } finally {
      setLoading(false);
    }
  };

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
