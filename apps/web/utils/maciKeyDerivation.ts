import { Keypair, PrivateKey, PublicKey } from "@maci-protocol/domainobjs";
import { keccak256, encodePacked } from "viem";

// ============ EIP-712 Constants with Domain Separation ============

/**
 * Domain Separation Parameters
 * - Prevents key reuse across different MACI contracts
 * - Prevents key reuse across different apps
 * - Includes chainId to prevent cross-chain attacks
 */
export interface DomainSeparationParams {
    chainId: number;
    maciAddress?: string;  // Optional: bind key to specific MACI contract
    appName?: string;      // Optional: bind key to specific app
}

const DEFAULT_APP_NAME = 'SaSvoth';
const KEY_GEN_VERSION = '2';  // Bump version when changing domain separation

const getKeyGenDomain = (params: DomainSeparationParams) => ({
    name: 'MACI Key Generation',
    version: KEY_GEN_VERSION,
    chainId: params.chainId,
    // Include MACI address if provided (for contract-specific keys)
    ...(params.maciAddress && { verifyingContract: params.maciAddress as `0x${string}` }),
});

const KEY_GEN_TYPES = {
    KeyGen: [
        { name: 'purpose', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'nonce', type: 'uint256' },
    ],
} as const;

/**
 * Build key generation message with domain separation
 */
const buildKeyGenMessage = (params: DomainSeparationParams) => ({
    purpose: 'Generate MACI keypair for private voting',
    app: params.appName || DEFAULT_APP_NAME,
    nonce: 0n,  // Can be incremented for key rotation
});

// ============ Types ============

export interface MaciKeypair {
    keypair: Keypair;
    privateKey: string;
    publicKey: string;
    pubKeyX: string;
    pubKeyY: string;
}

export interface StateIndexResult {
    stateIndex: string | null;
    blockNumber: number | null;
}

// ============ Module-level Cache (DEPRECATED) ============
// Use useMaciStore from @/stores/maciStore instead
// Keeping for backward compatibility during migration
const keypairCache = new Map<string, MaciKeypair>();

/** @internal */
function getCacheKey(walletAddress: string, chainId: number, maciAddress?: string): string {
    const base = `${walletAddress.toLowerCase()}_${chainId}`;
    return maciAddress ? `${base}_${maciAddress.toLowerCase()}` : base;
}

/**
 * @deprecated Use useMaciStore().clearKeypair() instead
 */
export function clearMaciKeyCache(walletAddress?: string, chainId?: number): void {
    console.warn('[DEPRECATED] clearMaciKeyCache - use useMaciStore().clearKeypair() instead');
    if (walletAddress && chainId) {
        for (const key of keypairCache.keys()) {
            if (key.startsWith(`${walletAddress.toLowerCase()}_${chainId}`)) {
                keypairCache.delete(key);
            }
        }
    } else if (walletAddress) {
        for (const key of keypairCache.keys()) {
            if (key.startsWith(walletAddress.toLowerCase())) {
                keypairCache.delete(key);
            }
        }
    } else {
        keypairCache.clear();
    }
}

/**
 * @deprecated Use useMaciStore().getKeypair() instead
 */
export function getCachedMaciKeypair(
    walletAddress: string,
    chainId: number,
    maciAddress?: string
): MaciKeypair | null {
    console.warn('[DEPRECATED] getCachedMaciKeypair - use useMaciStore().getKeypair() instead');
    const cacheKey = getCacheKey(walletAddress, chainId, maciAddress);
    return keypairCache.get(cacheKey) || null;
}

/**
 * @deprecated Use useMaciStore().hasKeypair() instead
 */
export function hasCachedMaciKeypair(
    walletAddress: string,
    chainId: number,
    maciAddress?: string
): boolean {
    console.warn('[DEPRECATED] hasCachedMaciKeypair - use useMaciStore().hasKeypair() instead');
    const cacheKey = getCacheKey(walletAddress, chainId, maciAddress);
    return keypairCache.has(cacheKey);
}

// ============ Main Helper Function ============

/**
 * Derive MACI keypair from EIP-712 signature with Domain Separation
 * 
 * Features:
 * - Deterministic: Same wallet + chain + MACI = Same keypair
 * - Domain Separated: Different MACI contracts = Different keypairs
 * - Cached: Only signs once per session
 * - Secure: Private key never stored in localStorage
 * 
 * @param walletAddress - User's wallet address
 * @param chainId - Current chain ID  
 * @param signTypedDataAsync - Function from wagmi's useSignTypedData hook
 * @param options - Optional domain separation parameters
 * 
 * Usage:
 * ```typescript
 * const { signTypedDataAsync } = useSignTypedData();
 * const { address } = useAccount();
 * const chainId = useChainId();
 * 
 * const { privateKey, publicKey, pubKeyX, pubKeyY } = await deriveMaciKeypair(
 *   address,
 *   chainId,
 *   signTypedDataAsync,
 *   { maciAddress: '0x...' }  // Optional: for contract-specific keys
 * );
 * ```
 */
export async function deriveMaciKeypair(
    walletAddress: string,
    chainId: number,
    signTypedDataAsync: (args: {
        domain: any;
        types: any;
        primaryType: string;
        message: any;
    }) => Promise<`0x${string}`>,
    options?: {
        maciAddress?: string;
        appName?: string;
        forceRefresh?: boolean;
        // NEW: Optional store integration for Zustand
        getFromStore?: () => MaciKeypair | null;
        setToStore?: (keypair: MaciKeypair) => void;
    }
): Promise<MaciKeypair> {
    if (!walletAddress) {
        throw new Error("Wallet address is required");
    }

    const { maciAddress, appName, forceRefresh = false, getFromStore, setToStore } = options || {};
    const cacheKey = getCacheKey(walletAddress, chainId, maciAddress);

    // Check store first (Zustand), then fallback to module cache
    if (!forceRefresh) {
        // Priority 1: Check Zustand store (if callback provided)
        if (getFromStore) {
            const storeKeypair = getFromStore();
            if (storeKeypair) {
                console.log("✅ Using keypair from Zustand store");
                return storeKeypair;
            }
        }
        
        // Priority 2: Fallback to legacy module cache (for backward compatibility)
        const cached = keypairCache.get(cacheKey);
        if (cached) {
            console.log("✅ Using cached MACI keypair (legacy)");
            // Also save to store if callback provided
            if (setToStore) {
                setToStore(cached);
            }
            return cached;
        }
    }

    // Build domain separation params
    const domainParams: DomainSeparationParams = {
        chainId,
        maciAddress,
        appName,
    };

    // Need to derive - request signature
    console.log("🔑 Requesting EIP-712 signature for MACI key derivation...");
    console.log("   Domain:", { chainId, maciAddress: maciAddress || 'global', app: appName || DEFAULT_APP_NAME });

    const signature = await signTypedDataAsync({
        domain: getKeyGenDomain(domainParams),
        types: KEY_GEN_TYPES,
        primaryType: "KeyGen",
        message: buildKeyGenMessage(domainParams),
    });

    // Derive keypair from signature with additional domain separation in hash
    // Include maciAddress in hash to ensure different keys per contract
    const hashInput = maciAddress
        ? encodePacked(['bytes', 'address'], [signature, maciAddress as `0x${string}`])
        : signature;

    const seed = BigInt(keccak256(hashInput));
    const userKeypair = new Keypair(new PrivateKey(seed));

    // Extract pubKey coordinates for subgraph/contract queries
    const pubKeyArray = userKeypair.publicKey.asArray();

    const result: MaciKeypair = {
        keypair: userKeypair,
        privateKey: userKeypair.privateKey.serialize(),
        publicKey: userKeypair.publicKey.serialize(),
        pubKeyX: pubKeyArray[0]?.toString() || '0',
        pubKeyY: pubKeyArray[1]?.toString() || '0',
    };

    // Save to Zustand store if callback provided (primary cache)
    if (setToStore) {
        setToStore(result);
        console.log("✅ MACI keypair derived and saved to Zustand store");
    }
    
    // Also save to legacy module cache for backward compatibility
    keypairCache.set(cacheKey, result);
    console.log("✅ MACI keypair also cached in legacy module cache");

    return result;
}

/**
 * Get public key coordinates from serialized public key
 */
export function getPubKeyCoordinates(serializedPubKey: string): { x: string; y: string } | null {
    try {
        const pubKey = PublicKey.deserialize(serializedPubKey);
        const coords = pubKey.asArray();
        return {
            x: coords[0]?.toString() || '0',
            y: coords[1]?.toString() || '0',
        };
    } catch (err) {
        console.error("Failed to parse public key:", err);
        return null;
    }
}

/**
 * Get public key only (from cache)
 * Does NOT prompt for signature
 */
export function getMaciPublicKey(
    walletAddress: string,
    chainId: number,
    maciAddress?: string
): string | null {
    const cached = getCachedMaciKeypair(walletAddress, chainId, maciAddress);
    return cached?.publicKey || null;
}

// ============ Blockchain Query Functions ============

/**
 * Query stateIndex from blockchain by scanning SignUp events
 * Uses viem's getLogs to find user's signup event
 * 
 * @param maciAddress - MACI contract address
 * @param publicKey - User's MACI public key (serialized or object)
 * @param publicClient - Viem public client from wagmi
 * @param startBlock - Block to start scanning from (optional)
 */
export async function getStateIndexFromChain(
    maciAddress: string,
    publicKey: string | { x: string; y: string },
    publicClient: any,
    startBlock?: number
): Promise<StateIndexResult> {
    try {
        if (!publicClient) {
            console.warn("No publicClient provided, skipping on-chain check");
            return { stateIndex: null, blockNumber: null };
        }

        // Get pubKey coordinates
        let pubKeyX: bigint;
        let pubKeyY: bigint;

        if (typeof publicKey === 'string') {
            const coords = getPubKeyCoordinates(publicKey);
            if (!coords) {
                throw new Error("Invalid public key format");
            }
            pubKeyX = BigInt(coords.x);
            pubKeyY = BigInt(coords.y);
        } else {
            pubKeyX = BigInt(publicKey.x);
            pubKeyY = BigInt(publicKey.y);
        }

        console.log(`🔍 Scanning SignUp events for pubKey (${pubKeyX.toString().slice(0, 10)}..., ${pubKeyY.toString().slice(0, 10)}...)`);

        // SignUp event ABI for MACI contract
        // event SignUp(uint256 indexed _stateIndex, uint256 indexed _userPubKeyX, uint256 indexed _userPubKeyY, ...)
        const SignUpEventSignature = '0x02f99de69f2d0c92e3f1b5cb5be14f7e9f7b22e5e4b06d3dd6c3f85f9b3f1a8c';

        // Alternative: Use keccak256 hash of event signature
        // SignUp(uint256,uint256,uint256,uint256,uint256,uint256)

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = startBlock ? BigInt(startBlock) : 0n;

        console.log(`   From block ${fromBlock} to ${currentBlock}`);

        // Query with viem's getLogs - scan in chunks
        const BLOCKS_PER_QUERY = 10000n;

        for (let block = fromBlock; block <= currentBlock; block += BLOCKS_PER_QUERY) {
            const toBlock = block + BLOCKS_PER_QUERY - 1n > currentBlock ? currentBlock : block + BLOCKS_PER_QUERY - 1n;

            try {
                // Use viem to get logs with topic filters
                // Topic[0] = event signature
                // Topic[1] = stateIndex (indexed)  
                // Topic[2] = userPubKeyX (indexed)
                // Topic[3] = userPubKeyY (indexed)
                const logs = await publicClient.getLogs({
                    address: maciAddress as `0x${string}`,
                    fromBlock: block,
                    toBlock: toBlock,
                    // Filter by pubKeyX and pubKeyY in topics
                });

                // Filter logs manually by checking pubKey coordinates in data or topics
                for (const log of logs) {
                    // Check if this log has our pubKey coordinates
                    // The exact structure depends on MACI's SignUp event
                    if (log.topics && log.topics.length >= 4) {
                        // topics[2] = pubKeyX, topics[3] = pubKeyY (if indexed)
                        const logPubKeyX = log.topics[2] ? BigInt(log.topics[2]) : null;
                        const logPubKeyY = log.topics[3] ? BigInt(log.topics[3]) : null;

                        if (logPubKeyX === pubKeyX && logPubKeyY === pubKeyY) {
                            const stateIndex = log.topics[1] ? BigInt(log.topics[1]).toString() : null;
                            console.log(`✅ Found SignUp event: stateIndex=${stateIndex}, block=${log.blockNumber}`);

                            return {
                                stateIndex: stateIndex,
                                blockNumber: log.blockNumber ? Number(log.blockNumber) : null,
                            };
                        }
                    }
                }
            } catch (queryErr) {
                console.warn(`Error querying blocks ${block}-${toBlock}:`, queryErr);
                // Continue to next chunk
            }
        }

        console.log("❌ No SignUp event found for this public key");
        return { stateIndex: null, blockNumber: null };

    } catch (err) {
        console.error("Failed to query SignUp events:", err);
        return { stateIndex: null, blockNumber: null };
    }
}

