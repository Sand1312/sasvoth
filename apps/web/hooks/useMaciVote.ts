import { useState } from "react";
import { useSignTypedData, useAccount, useChainId, usePublicClient } from "wagmi";
import { maciApi } from "../api/maci.api";
import { deriveMaciKeypair, getStateIndexFromChain } from "../utils/maciKeyDerivation";

export const useMaciVote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const handleVote = async (
    pollId: string,
    voteOptionIndex: number,
    voteWeight: number,
    nonce: number,
    maciAddress: string,
    password: string, // Changed signature
    startBlock?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // ============================================
      // Step 1: Derive MACI keypair (cached in memory)
      // ============================================
      console.log("Deriving MACI keypair...");
      const { privateKey, publicKey, pubKeyX, pubKeyY } = await deriveMaciKeypair(
        address,
        chainId,
        signTypedDataAsync,
        { maciAddress }
      );

      // ============================================
      // Step 2: Get stateIndex from blockchain
      // ============================================
      console.log("Fetching stateIndex from blockchain...");
      const { stateIndex } = await getStateIndexFromChain(
        maciAddress,
        { x: pubKeyX, y: pubKeyY },
        publicClient,
        startBlock
      );

      if (!stateIndex) {
        throw new Error("User not signed up (No stateIndex found on chain)");
      }

      console.log(`🗳️ Submitting vote: Option ${voteOptionIndex} with ${voteWeight} voice credits (Poll ${pollId}, Nonce ${nonce})`);

      // ============================================
      // Step 2.5: Calculate vote commitment
      //Hash(userVote, userVoiceCredits, userNonce, pollId, PASSWORD)
      // ============================================
      // @ts-ignore
      const circomlibjs = await import("circomlibjs");
      const poseidon = await circomlibjs.buildPoseidon();
      
      // Ensure password is numeric for BigInt
      // If user inputs non-numeric text, this will throw.
      // We assume user knows it must be numeric code, or we could handle it.
      let passwordBigInt;
      try {
        passwordBigInt = BigInt(password);
      } catch (e) {
        throw new Error("Password must be a numeric code");
      }

      const voteCommitment = poseidon.F.toString(poseidon([
          BigInt(voteOptionIndex),
          BigInt(voteWeight),
          BigInt(nonce),
          BigInt(pollId),
          passwordBigInt // Use password instead of privateKey
      ]));
      console.log("Calculated voteCommitment:", voteCommitment);

      // ============================================
      // Step 3: Call vote API
      // ============================================
      const result = await maciApi.vote(pollId, {
        voteOptionIndex,
        voteWeight,
        nonce,
        voteCommitment,
        userStateIndex: stateIndex,
        userMaciPrivateKey: privateKey,
        userMaciPublicKey: publicKey,
        maciAddress
      });

      if (!result.success) {
        throw new Error(result.error || "Vote failed");
      }

      console.log("Vote Success:", result);

      return {
        success: true,
        hash: result.hash,
      };

    } catch (err: any) {
      console.error("Vote failed:", err);
      setError(err.message || "Vote failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    vote: handleVote,
    loading,
    error,
  };
};

