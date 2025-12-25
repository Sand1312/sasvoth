/**
 * EIP-712 Shared Constants for MACI Signup
 * 
 * These types and domain definitions are used by:
 * - Frontend (useMaciSignup hook)
 * - Backend (signature verification)
 * - Smart Contract (SafeSignupGatekeeper)
 */

export const DEFAULT_EIP712_DOMAIN_NAME = 'SaSvoth Gatekeeper';
export const EIP712_DOMAIN_VERSION = '1';

// Keep legacy export for backward compatibility
export const EIP712_DOMAIN_NAME = DEFAULT_EIP712_DOMAIN_NAME;

/**
 * Chain-specific configuration
 */
export const CHAIN_CONFIG = {
  arbitrumSepolia: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
  },
} as const;

/**
 * EIP-712 Domain (without contract-specific fields)
 * verifyingContract and chainId should be set at runtime
 * 
 * @param chainId - Chain ID for the domain
 * @param verifyingContract - Contract address for verification
 * @param deploymentName - Optional deployment name (e.g., "CSES") - falls back to default
 */
export const getEIP712Domain = (
  chainId: number,
  verifyingContract: `0x${string}`,
  deploymentName?: string
) => ({
  name: deploymentName || DEFAULT_EIP712_DOMAIN_NAME,
  version: EIP712_DOMAIN_VERSION,
  chainId,
  verifyingContract,
});

/**
 * EIP-712 Type Definitions for SignupRequest
 */
export const SIGNUP_REQUEST_TYPES = {
  SignupRequest: [
    { name: 'pubKeyX', type: 'uint256' },
    { name: 'pubKeyY', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

/**
 * EIP-712 Type Definitions for Key Generation
 * Used to deterministically derive MACI keypair from wallet signature
 */
export const KEY_GEN_TYPES = {
  KeyGen: [
    { name: 'message', type: 'string' },
  ],
} as const;

/**
 * Key Generation Domain (simpler, used for key derivation)
 */
export const getKeyGenDomain = (chainId: number) => ({
  name: 'MACI Key Generation',
  version: '1',
  chainId,
});

/**
 * Standard message for key generation
 */
export const KEY_GEN_MESSAGE = 'Generate MACI keypair for SaSvoth voting';

/**
 * SignupRequest message type
 */
export interface SignupRequestMessage {
  pubKeyX: bigint;
  pubKeyY: bigint;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Helper to create signup request deadline (default: 15 minutes from now)
 */
export const createSignupDeadline = (minutes: number = 15): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
};
