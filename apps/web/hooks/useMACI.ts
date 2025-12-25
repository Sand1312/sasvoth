"use client";
import { maciApi } from "../api/maci.api";
import { useState } from "react";
import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import { MACI_ABI } from "@sasvoth/contracts";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

// New Hooks
import { useMaciSignup } from "./useMaciSignup";
import { useMaciJoinPoll } from "./useMaciJoinPoll";
import { useMaciVote } from "./useMaciVote";

export function useMaci() {
  const [status, setStatus] = useState<string>("");

  // Use new hooks
  const {
    signup: maciSignup,
    loading: sLoading,
    error: sError,
  } = useMaciSignup();
  const {
    joinPoll: maciJoinPoll,
    loading: jLoading,
    error: jError,
  } = useMaciJoinPoll();
  const { vote: maciVote, loading: vLoading, error: vError } = useMaciVote();

  const loading = sLoading || jLoading || vLoading;


  const getPublicClient = () => {
    const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL!;
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
    });
  };

  // Adapter: signupToMaci
  // The UI (PollClient) calls this with (x, y). We ignore them and let useMaciSignup generate new keys per Spec.
  // maciAddressOverride: Optional MACI address from poll data, overrides localStorage
  // startBlock: Optional start block from poll data for Merkle tree
  const signupToMaci = async (maciAddressOverride?: string, startBlock?: number) => {
    try {
      console.log(
        "signupToMaci: Ignoring passed keys, using internal generation per Spec v2"
      );

      // MACI address is required - must come from poll data
      if (!maciAddressOverride) {
        throw new Error("MACI address is required. Please provide maciAddress from poll data.");
      }

      console.log(
        "signupToMaci: calling maciSignup with address:",
        maciAddressOverride,
        "startBlock:",
        startBlock
      );

      const result = await maciSignup(maciAddressOverride, startBlock);
      console.log("signupToMaci: maciSignup result:", result);

      if (!result.success) {
        throw new Error(result.error || "Signup failed with unknown error");
      }

      // Return format expected by UI
      return {
        txHash: result.hash,
        stateIndex: result.stateIndex,
      };
    } catch (e: any) {
      console.error("Signup failed:", e);
      throw e;
    }
  };

  // Adapter: joinMaciPoll
  // maciAddressOverride: Required MACI address from poll data
  const joinMaciPoll = async (
    pollId: string,
    startBlock: number | undefined,
    privKey: string,
    signupBlockNumber?: number,
    maciAddressOverride?: string
  ) => {
    // 🔍 DEBUG: Log incoming parameters
    console.log(`🔍 [useMACI] joinMaciPoll ADAPTER called with:`, {
      pollId,
      startBlock,
      signupBlockNumber,
      maciAddressOverride: maciAddressOverride?.slice(0, 15),
    });

    // MACI address is required - must come from poll data
    if (!maciAddressOverride) {
      throw new Error("MACI address is required. Please provide maciAddress from poll data.");
    }

    // 🔍 DEBUG: Log resolved maciAddress
    console.log(`🔍 [useMACI] Using maciAddress:`, maciAddressOverride?.slice(0, 15) + "...");
    console.log(`🔍 [useMACI] Calling maciJoinPoll with pollId:`, pollId);

    // new joinPollAction uses stored key, but we pass pollId
    const result = await maciJoinPoll(maciAddressOverride, pollId);

    if (!result.success) throw new Error(result.error);

    return {
      pollStateIndex: result.pollStateIndex,
      voiceCredits: result.voiceCredits,
      hash: result.hash,
      alreadyJoined: result.alreadyJoined,
    };
  };

  // Adapter: submitVote
  // Simplified: useMaciVote now handles key derivation and stateIndex internally
  // maciAddressOverride: Required MACI address from poll data
  const submitVote = async (
    pollId: string,
    voteOptionIndex: number,
    voteWeight: number,
    nonce: number = 1,
    password: string, // New argument
    startBlock?: number,
    maciAddressOverride?: string
  ) => {
    // MACI address is required - must come from poll data
    if (!maciAddressOverride) {
      throw new Error("MACI address is required. Please provide maciAddress from poll data.");
    }

    // useMaciVote will derive keypair and get stateIndex from chain
    const result = await maciVote(
      pollId,
      voteOptionIndex,
      voteWeight,
      nonce,
      maciAddressOverride,
      password,
      startBlock
    );

    if (!result.success) throw new Error(result.error);

    return {
      hash: result.hash,
    };
  };

  // Other utility functions (kept for Dev Dashboard / Status Checks)

  const checkPollStatus = async (pollId: string, maciAddressOverride?: string) => {
    if (!maciAddressOverride) {
      throw new Error("MACI address is required. Please provide maciAddress from poll data.");
    }

    const client = getPublicClient();
    const pollData = (await client.readContract({
      address: maciAddressOverride as `0x${string}`,
      abi: MACI_ABI,
      functionName: "getPoll",
      args: [BigInt(pollId)],
    })) as any;

    const pollAddress = pollData.poll;
    return { isActive: true, hasStarted: true, hasEnded: false, pollAddress };
  };

  const getLatestPollId = async (maciAddressOverride?: string) => {
    if (!maciAddressOverride) {
      throw new Error("MACI address is required. Please provide maciAddress from poll data.");
    }

    const client = getPublicClient();
    try {
      const nextPollId = (await client.readContract({
        address: maciAddressOverride as `0x${string}`,
        abi: MACI_ABI,
        functionName: "nextPollId",
      })) as bigint;
      const latest = Number(nextPollId) - 1;
      return latest >= 0 ? latest.toString() : null;
    } catch (e) {
      return null;
    }
  };

  const getMaciStateIndex = async (pubKeyX: string, pubKeyY: string, maciAddressOverride?: string) => {
    if (!maciAddressOverride) {
      throw new Error("MACI address is required. Please provide maciAddress from poll data.");
    }

    const publicClient = getPublicClient();
    try {
      const publicKeyHash = (await publicClient.readContract({
        address: maciAddressOverride as `0x${string}`,
        abi: MACI_ABI,
        functionName: "hash2",
        args: [[BigInt(pubKeyX), BigInt(pubKeyY)]],
      })) as bigint;

      const stateIndex = await publicClient.readContract({
        address: maciAddressOverride as `0x${string}`,
        abi: MACI_ABI,
        functionName: "getStateIndex",
        args: [publicKeyHash],
      });
      return Number(stateIndex);
    } catch (e) {
      return null;
    }
  };

  return {
    deployMaciContract: maciApi.deployMaci, // Kept API call
    joinMaciPoll,
    deployPoll: maciApi.createPoll, // Kept API call
    mergePoll: maciApi.mergePoll, // Kept API call
    mergeStateDirect: maciApi.mergeStateDirect, // Kept API call
    generateProofs: maciApi.generateProofs, // Kept API call
    submitProofs: maciApi.submitProofs, // Kept API call
    getPollContracts: maciApi.getPollContracts, // Kept API call
    loading,
    status,
    signupToMaci,
    submitVote,
    checkPollStatus,
    getLatestPollId,
    getMaciStateIndex,
  };
}
