import { useState } from "react";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { maciApi } from "../api/maci.api";
import { useSignTypedData, useAccount, useChainId } from "wagmi";
import { keccak256 } from "viem";

// ============ EIP-712 Constants (inline until shared package is linked) ============

const EIP712_DOMAIN_NAME = 'SaSvoth Gatekeeper';
const EIP712_DOMAIN_VERSION = '1';

const getEIP712Domain = (chainId: number, verifyingContract: `0x${string}`) => ({
  name: EIP712_DOMAIN_NAME,
  version: EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract,
});

const getKeyGenDomain = (chainId: number) => ({
  name: 'MACI Key Generation',
  version: '1',
  chainId,
});

const SIGNUP_REQUEST_TYPES = {
  SignupRequest: [
    { name: 'subject', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

const KEY_GEN_TYPES = {
  KeyGen: [{ name: 'message', type: 'string' }],
} as const;

const KEY_GEN_MESSAGE = 'Generate MACI keypair for SaSvoth voting';

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
      // Step A: Generate MACI Key from EIP-712 Signature
      // ============================================
      console.log("Step A: Generating MACI keypair from EIP-712 signature...");

      const keyGenSignature = await signTypedDataAsync({
        domain: getKeyGenDomain(chainId),
        types: KEY_GEN_TYPES,
        primaryType: "KeyGen",
        message: { message: KEY_GEN_MESSAGE },
      });

      // Derive MACI private key from signature hash
      const seed = BigInt(keccak256(keyGenSignature));
      const userKeypair = new Keypair(new PrivateKey(seed));

      const publicKey = userKeypair.publicKey.serialize();
      const privateKey = userKeypair.privateKey.serialize();

      // Extract x/y coordinates for the contract
      // Access the public key's asArray method for raw values
      const pubKeyArray = userKeypair.publicKey.asArray();
      const pubKeyX = pubKeyArray?.[0]?.toString() ?? "0";
      const pubKeyY = pubKeyArray?.[1]?.toString() ?? "0";

      console.log("MACI Keypair generated:", { publicKey: publicKey.substring(0, 30) + "..." });

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
      // Step E: Store keys locally
      // ============================================
      if (typeof window !== "undefined") {
        localStorage.setItem("maci_priv_key", privateKey);
        localStorage.setItem("maci_pub_key", publicKey);
        if (result.stateIndex !== undefined) {
          localStorage.setItem("maci_state_index", result.stateIndex.toString());
        }
        if (result.blockNumber) {
          localStorage.setItem("signupBlockNumber", result.blockNumber.toString());
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
