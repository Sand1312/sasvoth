import { useState } from "react";
// Import the Server Action
// Import API
import { maciApi } from "../api/maci.api";

export const useMaciJoinPoll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinPoll = async (maciAddress: string, pollId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Retrieve Keys from LocalStorage
      const privateKey = localStorage.getItem("maci_priv_key");
      if (!privateKey) {
        throw new Error("User not signed up (No MACI Private Key found)");
      }

      // Get startBlock from localStorage (important for Arbitrum Sepolia performance)
      // Priority: signupBlockNumber > maciStartBlock > 0
      const signupBlockStr = localStorage.getItem("signupBlockNumber");
      const maciStartBlockStr = localStorage.getItem("maciStartBlock");

      // IMPORTANT: For joinPoll, we MUST scan from MACI deploy block
      // to build the full Merkle tree with ALL signups (not just user's signup)
      let startBlock = 0;
      if (maciStartBlockStr) {
        startBlock = parseInt(maciStartBlockStr);
        console.log("Using maciStartBlock for full Merkle tree:", startBlock);
      } else {
        // Fallback to hardcoded MACI deploy block
        startBlock = 224688901;
        console.log("Using hardcoded maciStartBlock:", startBlock);
      }

      console.log(
        "Final startBlock for joinPoll:",
        startBlock,
        "(signupBlockNumber:",
        signupBlockStr,
        ")"
      );

      console.log("Calling JoinPoll API...", {
        pollId,
        maciAddress,
        startBlock,
      });

      // 2. Call API
      const result = await maciApi.joinPoll(pollId, {
        maciAddress,
        maciPrivateKey: privateKey,
        startBlock
      });

      if (!result.success) {
        throw new Error(result.error || "Join Poll failed");
      }

      console.log("Join Poll Success:", result);

      // 3. Store Result State
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
