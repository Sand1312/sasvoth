import { useState } from "react";
import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import { generateKeypair } from "@maci-protocol/crypto";
import { maciApi } from "../api/maci.api";
import { useSignMessage } from "wagmi";
import { keccak256 } from "viem";

const ZERO_DATA =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const useMaciSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();

  const handleSignup = async (maciAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Generate new Keypair (Client Side)
      console.log("Creating MACI Keypair...");

      let publicKey: string;
      let privateKey: string;

      try {
        // Deterministic generation using Wallet Signature
        const signature = await signMessageAsync({
          message:
            "Sign this message to generate your MACI keypair. This ensures you can always recover your account.",
        });
        const seed = BigInt(keccak256(signature));
        const userKeypair = new Keypair(new PrivateKey(seed));
        
        console.log("Keypair created from signature:", userKeypair);

        if (userKeypair.publicKey && userKeypair.privateKey) {
          publicKey = userKeypair.publicKey.serialize();
          privateKey = userKeypair.privateKey.serialize();
        } else {
          throw new Error("Keypair properties undefined");
        }
      } catch (keypairError) {
        console.warn(
          "Signature signing failed or rejected:",
          keypairError
        );
        throw keypairError;
      }

      console.log("Generated MACI Keypair", { publicKey, privateKey });

      // 2. Call API to Signup
      console.log("Calling Signup API with:", {
        maciAddress,
        publicKey,
      });

      let result;
      try {
        result = await maciApi.signup({
          maciAddress, 
          maciPubKey: publicKey, 
          sgData: ZERO_DATA 
        });
        console.log("API returned:", result);
      } catch (serverError: any) {
        console.error("API threw error:", serverError);
        throw new Error(
          `Signup failed: ${serverError.message || serverError}`
        );
      }

      if (!result || !result.success) {
        const errorMsg = result?.error || "Signup failed with unknown error";
        console.error("Signup result indicates failure:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("Signup Success:", result);

      // 3. Store Keys & State Index
      if (typeof window !== "undefined") {
        localStorage.setItem("maci_priv_key", privateKey);
        localStorage.setItem("maci_pub_key", publicKey);
        if (result.stateIndex) {
          localStorage.setItem(
            "maci_state_index",
            result.stateIndex.toString()
          );
        }
        // Store signup block number for joinPoll to use
        if (result.blockNumber) {
          localStorage.setItem(
            "signupBlockNumber",
            result.blockNumber.toString()
          );
          console.log("Stored signupBlockNumber:", result.blockNumber);
        }
      }

      return {
        success: true,
        hash: result.hash,
        stateIndex: result.stateIndex,
        blockNumber: result.blockNumber,
      };
    } catch (err: any) {
      console.error("Signup failed:", err);
      setError(err.message || "Signup failed");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signup: handleSignup,
    loading,
    error,
  };
};
