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

      console.log("Voting via API...", { pollId, voteOptionIndex, voteWeight, nonce, stateIndex });

      // ============================================
      // Step 3: Call vote API
      // ============================================
      const result = await maciApi.vote(pollId, {
        voteOptionIndex,
        voteWeight,
        nonce,
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

