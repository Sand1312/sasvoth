import { useState } from "react";
import { maciApi } from "../api/maci.api";
import { useSignTypedData, useAccount, useChainId, usePublicClient } from "wagmi";
import { deriveMaciKeypair, getStateIndexFromChain } from "../utils/maciKeyDerivation";

// ============ EIP-712 Constants for Signup Request ============

const EIP712_DOMAIN_NAME = 'SaSvoth Gatekeeper';
const EIP712_DOMAIN_VERSION = '1';

const getEIP712Domain = (chainId: number, verifyingContract: `0x${string}`) => ({
  name: EIP712_DOMAIN_NAME,
  version: EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract,
});

const SIGNUP_REQUEST_TYPES = {
  SignupRequest: [
    { name: 'subject', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

const createSignupDeadline = (minutes: number = 15): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
};

// ============ Hook ============

/**
 * Gatekeeper contract address - should be set via environment variable
 */
const GATEKEEPER_ADDRESS = (process.env.NEXT_PUBLIC_GATEKEEPER_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const useMaciSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const handleSignup = async (maciAddress: string) => {
    setLoading(true);
    setError(null);

    if (!address) {
      setError("Wallet not connected");
      setLoading(false);
      return { success: false, error: "Wallet not connected" };
    }

    try {
      // ============================================
      // Step A: Generate MACI Key with Domain Separation
      // ============================================
      console.log("Step A: Generating MACI keypair with Domain Separation...");

      const { publicKey, pubKeyX, pubKeyY } = await deriveMaciKeypair(
        address,
        chainId,
        signTypedDataAsync,
        { maciAddress }  // Domain separation: bind to specific MACI contract
      );

      console.log("MACI Keypair generated:", { publicKey: publicKey.substring(0, 30) + "..." });

      // ============================================
      // Step A.1: Check if already signed up on chain
      // ============================================
      // Get startBlock from localStorage to avoid scanning from block 0
      const maciStartBlock = typeof window !== 'undefined'
        ? localStorage.getItem("maciStartBlock")
        : null;

      if (maciStartBlock && publicClient) {
        console.log("Step A.1: Checking if already signed up on chain...");

        try {
          const { stateIndex, blockNumber } = await getStateIndexFromChain(
            maciAddress,
            { x: pubKeyX, y: pubKeyY },
            publicClient,
            parseInt(maciStartBlock)
          );

          if (stateIndex) {
            console.log("✅ Already signed up! StateIndex:", stateIndex);
            // User already signed up - no need to call API
            return {
              success: true,
              hash: null, // No new transaction
              stateIndex: stateIndex,
              blockNumber: blockNumber,
              alreadySignedUp: true,
            };
          }
        } catch (checkErr) {
          console.log("Could not check on-chain status, proceeding with signup:", checkErr);
        }
      } else {
        console.log("Step A.1: Skipping on-chain check (no maciStartBlock configured)");
      }

      // ============================================
      // Step B: Get nonce and create signup request
      // ============================================
      console.log("Step B: Fetching nonce and creating signup request...");

      // Fetch current nonce from backend/contract
      let nonce: bigint = 0n;
      try {
        const nonceResult = await maciApi.getNonce(address);
        nonce = BigInt(nonceResult.nonce || 0);
      } catch (e) {
        console.log("Could not fetch nonce, using 0");
      }

      // Create deadline (15 minutes from now)
      const deadline = createSignupDeadline(15);

      console.log("Signing signup request with:", { pubKeyX, pubKeyY, nonce: nonce.toString(), deadline: deadline.toString() });

      // ============================================
      // Step C: Sign the signup request with EIP-712
      // ============================================
      console.log("Step C: Signing EIP-712 signup request...");

      const signupSignature = await signTypedDataAsync({
        domain: getEIP712Domain(chainId, GATEKEEPER_ADDRESS),
        types: SIGNUP_REQUEST_TYPES,
        primaryType: "SignupRequest",
        message: {
          subject: address,
          nonce,
          deadline,
        },
      });

      console.log("Signup signature obtained:", signupSignature.substring(0, 30) + "...");

      // ============================================
      // Step D: Send to backend for relay
      // ============================================
      console.log("Step D: Sending to backend for relay...");

      try {
        const result = await maciApi.signupWithSignature({
          maciAddress,
          pubKeyX,
          pubKeyY,
          signature: signupSignature,
          nonce: Number(nonce),
          deadline: Number(deadline),
        });

        if (!result || !result.success) {
          const errorMsg = result?.error || "Signup failed with unknown error";
          throw new Error(errorMsg);
        }

        console.log("Signup Success:", result);

        // ============================================
        // Step E: Keys are now cached in memory by deriveMaciKeypair
        // No localStorage needed!
        // ============================================

        return {
          success: true,
          hash: result.hash,
          stateIndex: result.stateIndex,
          blockNumber: result.blockNumber,
        };
      } catch (apiErr: any) {
        // Check if error is "already signed up" - treat as success
        const errMsg = apiErr?.message || apiErr?.response?.data?.error || String(apiErr);
        const isAlreadySignedUp =
          errMsg.toLowerCase().includes("already") ||
          errMsg.toLowerCase().includes("signed up") ||
          errMsg.toLowerCase().includes("registered");

        if (isAlreadySignedUp) {
          console.log("✅ User already signed up - treating as success");
          return {
            success: true,
            hash: null,
            stateIndex: null, // Will be fetched later if needed
            blockNumber: null,
            alreadySignedUp: true,
          };
        }

        // Re-throw other errors
        throw apiErr;
      }
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


