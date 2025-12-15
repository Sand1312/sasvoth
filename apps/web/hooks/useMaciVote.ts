import { useState } from "react";
// Remove SDK, use Server Action
// import { publishBatch } from "@maci-protocol/sdk";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { maciApi } from "../api/maci.api";

export const useMaciVote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (
    pollId: string,
    voteOptionIndex: number,
    voteWeight: number,
    nonce: number,
    maciAddress: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const privateKey = localStorage.getItem("maci_priv_key");
      const stateIndexStr = localStorage.getItem("maci_state_index");
      if (!privateKey || !stateIndexStr) {
        throw new Error("User not signed up (Missing privKey or stateIndex)");
      }

      const userPrivKey = PrivateKey.deserialize(privateKey);
      const userKeypair = new Keypair(userPrivKey);
      
      console.log("Voting via API...", { pollId, voteOptionIndex, voteWeight, nonce });

      // Generate Public Key string from Keypair to pass to server
      const publicKey = userKeypair.publicKey.serialize(); 

      const result = await maciApi.vote(pollId, {
        voteOptionIndex,
        voteWeight,
        nonce,
        userStateIndex: stateIndexStr,
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
