import { useState } from "react";
import { useSignTypedData, useAccount, useChainId } from "wagmi";
import { maciApi } from "../api/maci.api";
import { deriveMaciKeypair } from "../utils/maciKeyDerivation";

export const useMaciJoinPoll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();

  const handleJoinPoll = async (maciAddress: string, pollId: string, startBlock?: number) => {
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
      const { privateKey } = await deriveMaciKeypair(
        address,
        chainId,
        signTypedDataAsync,
        { maciAddress }
      );

      // ============================================
      // Step 2: Determine startBlock for Merkle tree
      // ============================================
      let effectiveStartBlock = startBlock || 0;

      // Fallback to localStorage if not provided (for backward compatibility)
      if (!effectiveStartBlock && typeof window !== "undefined") {
        const maciStartBlockStr = localStorage.getItem("maciStartBlock");
        if (maciStartBlockStr) {
          effectiveStartBlock = parseInt(maciStartBlockStr);
          console.log("Using maciStartBlock from localStorage:", effectiveStartBlock);
        }
      }

      // Ultimate fallback to hardcoded block
      if (!effectiveStartBlock) {
        effectiveStartBlock = 224688901;
        console.log("Using hardcoded maciStartBlock:", effectiveStartBlock);
      }

      console.log("Calling JoinPoll API...", {
        pollId,
        maciAddress,
        startBlock: effectiveStartBlock,
      });

      // ============================================
      // Step 3: Call API
      // ============================================
      const result = await maciApi.joinPoll(pollId, {
        maciAddress,
        maciPrivateKey: privateKey,
        startBlock: effectiveStartBlock
      });

      if (!result.success) {
        throw new Error(result.error || "Join Poll failed");
      }

      console.log("Join Poll Success:", result);

      return {
        success: true,
        pollStateIndex: result.pollStateIndex,
        voiceCredits: result.voiceCredits,
        hash: result.hash,
        alreadyJoined: result.alreadyJoined,
      };
    } catch (err: any) {
      console.error("Join Poll failed:", err);
      setError(err.message || "Join Poll failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    joinPoll: handleJoinPoll,
    loading,
    error,
  };
};

