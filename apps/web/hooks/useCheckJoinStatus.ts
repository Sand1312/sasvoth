import { useState, useCallback } from "react";

/**
 * Response from subgraph query for poll join status
 */
interface RegistrationData {
  id: string;
  createdAt: string;
  poll: {
    pollId: string;
  };
  user: {
    id: string;
  };
}

interface AccountData {
  id: string;
  voiceCreditBalance: string;
}

interface CheckJoinStatusResult {
  isJoined: boolean;
  pollStateIndex: string | null;
  voiceCredits: string | null;
  source: "subgraph" | "chain" | "none";
}

/**
 * Result for MACI signup status check (global signup, not per-poll)
 */
interface CheckSignupStatusResult {
  isSignedUp: boolean;
  stateIndex: string | null;
  voiceCredits: string | null;
  source: "subgraph" | "chain" | "none";
}
import { maciApi } from "../api/maci.api";

// Module-level cache for subgraph URL to avoid repeated API calls
let cachedSubgraphUrl: string | null = null;

/**
 * Get the subgraph URL dynamically from database (like SmartNonceService)
 * Priority: 1. Cached value  2. API call  3. localStorage  4. Env var
 */
const getSubgraphUrl = async (): Promise<string | null> => {
  // Return cached value if available
  if (cachedSubgraphUrl) {
    return cachedSubgraphUrl;
  }

  // Try to fetch from API (like SmartNonceService.getSubgraphUrl())
  try {
    console.log("📡 [getSubgraphUrl] Fetching from API...");
    const config = await maciApi.getConfig();
    if (config.subgraphUrl) {
      console.log(`📡 [getSubgraphUrl] Got from API: ${config.subgraphUrl.slice(0, 50)}...`);
      cachedSubgraphUrl = config.subgraphUrl;
      return config.subgraphUrl;
    }
  } catch (err) {
    console.warn("📡 [getSubgraphUrl] API call failed, trying fallbacks...", err);
  }

  // Fallback: localStorage
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("subgraphUrl");
    if (stored) {
      console.log(`📡 [getSubgraphUrl] Got from localStorage: ${stored.slice(0, 50)}...`);
      cachedSubgraphUrl = stored;
      return stored;
    }
  }

  // Fallback: env var
  const envUrl = process.env.NEXT_PUBLIC_SUBGRAPH_URL || null;
  if (envUrl) {
    console.log(`📡 [getSubgraphUrl] Got from env: ${envUrl.slice(0, 50)}...`);
    cachedSubgraphUrl = envUrl;
  } else {
    console.warn("📡 [getSubgraphUrl] No subgraph URL available from any source");
  }
  
  return envUrl;
};

/**
 * Build user ID from public key coordinates (format used in schema: "x y")
 */
const buildUserId = (pubKeyX: string, pubKeyY: string): string => {
  return `${pubKeyX} ${pubKeyY}`;
};

/**
 * Query to check if a user has signed up to MACI (User entity)
 * User.id = "pubKeyX pubKeyY" (space-separated)
 * Account.id = stateIndex
 */
const buildUserSignupQuery = (userId: string) => `
  query CheckMaciSignup {
    user(id: "${userId}") {
      id
      createdAt
      accounts {
        id
        voiceCreditBalance
      }
    }
  }
`;

/**
 * Query to check if a user has registered for a specific poll
 * Uses Registration entity: id = "pollId-userId"
 */
const buildRegistrationQuery = (userId: string, pollId: string) => `
  query CheckRegistration {
    registrations(
      where: {
        id: "${pollId}-${userId}"
      },
      first: 1
    ) {
      id
      createdAt
      poll {
        pollId
      }
      user {
        id
      }
    }
  }
`;

/**
 * Alternative: Query user's registrations and filter by pollId
 */
const buildUserRegistrationsQuery = (userId: string, pollId: string) => `
  query CheckUserRegistrations {
    user(id: "${userId}") {
      id
      registrations(where: { poll_: { pollId: "${pollId}" } }) {
        id
        createdAt
      }
      accounts {
        id
        voiceCreditBalance
      }
    }
  }
`;

/**
 * Query to get account (stateIndex) for a user
 * Account.id = stateIndex
 */
const buildAccountQuery = (stateIndex: string) => `
  query GetAccount {
    account(id: "${stateIndex}") {
      id
      voiceCreditBalance
    }
  }
`;

/**
 * Hook to check if a user has joined a specific poll
 * 
 * Strategy:
 * 1. Build userId from pubKeyX + pubKeyY (format: "x y")
 * 2. Query Registration entity with id = "pollId-userId"
 * 3. If found, user has joined
 * 4. Fall back to localStorage if subgraph fails
 */
export const useCheckJoinStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check join status from subgraph using Registration entity
   * Registration.id format: "pollId-userId" where userId = "pubKeyX pubKeyY"
   */
  const checkFromSubgraph = async (
    pubKeyX: string,
    pubKeyY: string,
    pollId: string
  ): Promise<CheckJoinStatusResult> => {
    const subgraphUrl = await getSubgraphUrl();

    if (!subgraphUrl) {
      console.warn("No subgraph URL configured, falling back to localStorage");
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }

    try {
      // Build userId from pubKey coordinates (format: "x y")
      const userId = buildUserId(pubKeyX, pubKeyY);
      
      // Try direct Registration lookup first (most efficient)
      const query = buildRegistrationQuery(userId, pollId);

      const response = await fetch(subgraphUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Subgraph query failed: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.errors) {
        console.warn("Subgraph query errors:", json.errors);
        // Try alternative query via User entity
        return await tryAlternativeQuery(userId, pollId, subgraphUrl);
      }

      const registrations = json.data?.registrations;

      if (registrations && registrations.length > 0) {
        const registration = registrations[0];
        console.log(`✅ Found registration in subgraph: ${registration.id}`);
        
        // Note: Registration doesn't have stateIndex directly
        // stateIndex is in Account entity, but we don't have a direct link
        // For now, return isJoined = true without stateIndex
        // The stateIndex will be fetched from chain when needed
        return {
          isJoined: true,
          pollStateIndex: null, // Need separate Account lookup
          voiceCredits: null,
          source: "subgraph",
        };
      }

      // No registration found
      console.log(`❌ No registration found for user ${userId.slice(0, 20)}... in poll ${pollId}`);
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "subgraph" };

    } catch (err: any) {
      console.error("Subgraph query failed:", err);
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }
  };

  /**
   * Try alternative query via User entity with registrations relation
   */
  const tryAlternativeQuery = async (
    userId: string,
    pollId: string,
    subgraphUrl: string
  ): Promise<CheckJoinStatusResult> => {
    try {
      const query = buildUserRegistrationsQuery(userId, pollId);

      const response = await fetch(subgraphUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();

      if (!json.errors && json.data?.user?.registrations?.length > 0) {
        const user = json.data.user;
        console.log(`✅ Found user with registrations in poll ${pollId}`);
        
        // Try to get voiceCredits from first account
        const voiceCredits = user.accounts?.[0]?.voiceCreditBalance || null;
        const stateIndex = user.accounts?.[0]?.id || null;
        
        return {
          isJoined: true,
          pollStateIndex: stateIndex,
          voiceCredits: voiceCredits,
          source: "subgraph",
        };
      }
    } catch (err) {
      console.warn("Alternative subgraph query also failed:", err);
    }

    return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
  };

  /**
   * Check join status from chain by scanning PollJoined events (RPC fallback)
   * Similar to getStateIndexFromChain in useCheckSignupStatus
   */
  const checkFromChain = async (
    pubKeyX: string,
    pubKeyY: string,
    pollId: string,
    maciAddress: string,
    publicClient: any,
    startBlock?: number
  ): Promise<CheckJoinStatusResult> => {
    try {
      if (!publicClient || !maciAddress) {
        console.log("⛓️ [checkJoinStatus] Missing publicClient or maciAddress for RPC fallback");
        return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
      }

      console.log(`⛓️ [checkJoinStatus] Falling back to RPC chain query for poll ${pollId}...`);

      // Import ABI dynamically
      const { MACI_ABI, POLL_ABI } = await import("@sasvoth/contracts");

      // Get Poll contract address from MACI
      const pollContracts = await publicClient.readContract({
        address: maciAddress as `0x${string}`,
        abi: MACI_ABI,
        functionName: "getPoll",
        args: [BigInt(pollId)],
      }) as readonly [`0x${string}`, `0x${string}`, `0x${string}`];

      const pollAddress = pollContracts[0];
      console.log(`   Poll address: ${pollAddress}`);

      // Scan PollJoined events for this pubKey
      // PollJoined event: (indexed _pollPublicKeyX, indexed _pollPublicKeyY, _voiceCreditBalance, _nullifier, _pollStateIndex)
      const effectiveStartBlock = startBlock ? BigInt(startBlock) : BigInt(224688901);

      const logs = await publicClient.getLogs({
        address: pollAddress,
        event: {
          type: "event",
          name: "PollJoined",
          inputs: [
            { type: "uint256", name: "_pollPublicKeyX", indexed: true },
            { type: "uint256", name: "_pollPublicKeyY", indexed: true },
            { type: "uint256", name: "_voiceCreditBalance", indexed: false },
            { type: "uint256", name: "_nullifier", indexed: false },
            { type: "uint256", name: "_pollStateIndex", indexed: false },
          ],
        },
        args: {
          _pollPublicKeyX: BigInt(pubKeyX),
          _pollPublicKeyY: BigInt(pubKeyY),
        },
        fromBlock: effectiveStartBlock,
        toBlock: "latest",
      });

      if (logs.length > 0) {
        const log = logs[0];
        const args = log.args as {
          _voiceCreditBalance: bigint;
          _pollStateIndex: bigint;
        };

        console.log(`✅ [checkJoinStatus] Found PollJoined event on-chain! pollStateIndex=${args._pollStateIndex}`);

        return {
          isJoined: true,
          pollStateIndex: args._pollStateIndex.toString(),
          voiceCredits: args._voiceCreditBalance.toString(),
          source: "chain" as const,
        };
      }

      console.log("❌ [checkJoinStatus] Not found on-chain");
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };

    } catch (err) {
      console.warn("⛓️ [checkJoinStatus] RPC fallback failed:", err);
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }
  };

  /**
   * Main check function - tries subgraph first, then RPC chain, then localStorage
   * 
   * @param pollId - Poll ID to check
   * @param pubKeyX - Public key X coordinate
   * @param pubKeyY - Public key Y coordinate
   * @param maciAddress - Optional MACI address for RPC fallback
   * @param publicClient - Optional viem public client for RPC fallback
   * @param startBlock - Optional start block for event scanning
   */
  const checkJoinStatus = useCallback(async (
    pollId: string,
    pubKeyX?: string,
    pubKeyY?: string,
    maciAddress?: string,
    publicClient?: any,
    startBlock?: number
  ): Promise<CheckJoinStatusResult> => {
    setLoading(true);
    setError(null);

    try {
      // If we have public key, check subgraph first
      if (pubKeyX && pubKeyY) {
        const subgraphResult = await checkFromSubgraph(pubKeyX, pubKeyY, pollId);

        if (subgraphResult.isJoined) {
          // Also update poll-specific localStorage for faster future checks
          if (typeof window !== "undefined" && subgraphResult.pollStateIndex) {
            localStorage.setItem(`maci_poll_state_index_${pollId}`, subgraphResult.pollStateIndex);
            if (subgraphResult.voiceCredits) {
              localStorage.setItem(`maci_voice_credits_${pollId}`, subgraphResult.voiceCredits);
            }
          }
          return subgraphResult;
        }

        // RPC chain fallback when Graph not available or not found (ACID: Consistency)
        const shouldTryRpc = (subgraphResult.source === "subgraph" || subgraphResult.source === "none")
                             && maciAddress
                             && publicClient;

        if (shouldTryRpc) {
          const chainResult = await checkFromChain(pubKeyX, pubKeyY, pollId, maciAddress, publicClient, startBlock);
          if (chainResult.isJoined) {
            return chainResult;
          }
        }
      }

      // Not joined (no localStorage fallback - rely on subgraph + RPC chain query only)
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };

    } catch (err: any) {
      console.error("Check join status failed:", err);
      setError(err.message);
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkJoinStatus,
    loading,
    error,
  };
};

// ============================================================
// MACI Signup Status Hook (Global signup, not per-poll)
// ============================================================

/**
 * Hook to check if a user has signed up to MACI (global, not poll-specific)
 * 
 * Strategy:
 * 1. Query Graph for User entity with pubKey as ID
 * 2. If found, get stateIndex from Account.id
 * 3. Fall back to RPC chain query if Graph fails
 * 
 * Usage:
 * ```typescript
 * const { checkSignupStatus } = useCheckSignupStatus();
 * const result = await checkSignupStatus(pubKeyX, pubKeyY, maciAddress, publicClient);
 * if (result.isSignedUp) {
 *   console.log('StateIndex:', result.stateIndex);
 * }
 * ```
 */
export const useCheckSignupStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check signup status from subgraph (User entity)
   */
  const checkFromGraph = async (
    pubKeyX: string,
    pubKeyY: string
  ): Promise<CheckSignupStatusResult> => {
    const subgraphUrl = await getSubgraphUrl();

    if (!subgraphUrl) {
      console.warn("No subgraph URL configured");
      return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "none" };
    }

    try {
      const userId = buildUserId(pubKeyX, pubKeyY);
      const query = buildUserSignupQuery(userId);

      const response = await fetch(subgraphUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Subgraph query failed: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.errors) {
        console.warn("Subgraph query errors:", json.errors);
        return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "none" };
      }

      const user = json.data?.user;

      if (user) {
        console.log(`✅ Found user in subgraph: ${user.id.slice(0, 30)}...`);
        
        // Get stateIndex and voiceCredits from first Account
        const account = user.accounts?.[0];
        
        return {
          isSignedUp: true,
          stateIndex: account?.id || null,
          voiceCredits: account?.voiceCreditBalance || null,
          source: "subgraph",
        };
      }

      console.log(`❌ User not found in subgraph`);
      return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "subgraph" };

    } catch (err: any) {
      console.error("Graph signup check failed:", err);
      return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "none" };
    }
  };

  /**
   * Main check function - Graph first, then RPC fallback
   * 
   * @param pubKeyX - Public key X coordinate
   * @param pubKeyY - Public key Y coordinate
   * @param maciAddress - MACI contract address (for RPC fallback)
   * @param publicClient - Viem public client (for RPC fallback)
   * @param startBlock - Block to start scanning from (for RPC fallback)
   */
  const checkSignupStatus = useCallback(async (
    pubKeyX: string,
    pubKeyY: string,
    maciAddress?: string,
    publicClient?: any,
    startBlock?: number
  ): Promise<CheckSignupStatusResult> => {
    setLoading(true);
    setError(null);

    console.log("🔍 [checkSignupStatus] Starting check...");

    try {
      // Priority 1: Try Graph (fast)
      console.log("📊 [checkSignupStatus] Querying Graph...");
      const graphResult = await checkFromGraph(pubKeyX, pubKeyY);
      console.log(`📊 [checkSignupStatus] Graph result: isSignedUp=${graphResult.isSignedUp}, source=${graphResult.source}`);
      
      if (graphResult.isSignedUp) {
        console.log(`✅ [checkSignupStatus] Found in Graph! StateIndex: ${graphResult.stateIndex}`);
        return graphResult;
      }

      // Priority 2: Try RPC as fallback when:
      // - Graph returned "not found" (source === "subgraph")
      // - OR Graph was unavailable (source === "none")
      const shouldTryRpc = (graphResult.source === "subgraph" || graphResult.source === "none") 
                           && maciAddress 
                           && publicClient;
      
      if (shouldTryRpc) {
        console.log("⛓️ [checkSignupStatus] Falling back to RPC chain query...");
        
        // Import dynamically to avoid circular dependencies
        const { getStateIndexFromChain } = await import("@/lib/maci-key-derivation");
        
        const chainResult = await getStateIndexFromChain(
          maciAddress,
          { x: pubKeyX, y: pubKeyY },
          publicClient,
          startBlock
        );

        if (chainResult.stateIndex) {
          console.log(`✅ [checkSignupStatus] Found on-chain: stateIndex=${chainResult.stateIndex}`);
          return {
            isSignedUp: true,
            stateIndex: chainResult.stateIndex,
            voiceCredits: null, // Not available from chain events
            source: "chain",
          };
        } else {
          console.log("❌ [checkSignupStatus] Not found on-chain either");
        }
      } else {
        console.log("⚠️ [checkSignupStatus] Cannot try RPC fallback - missing maciAddress or publicClient");
      }

      // Not signed up
      console.log("❌ [checkSignupStatus] User not signed up");
      return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "none" };

    } catch (err: any) {
      console.error("💥 [checkSignupStatus] Failed:", err);
      setError(err.message);
      return { isSignedUp: false, stateIndex: null, voiceCredits: null, source: "none" };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkSignupStatus,
    loading,
    error,
  };
};
