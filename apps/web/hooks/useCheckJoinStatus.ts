import { useState, useCallback } from "react";

/**
 * Response from subgraph query for poll join status
 */
interface PollJoinedData {
  pollId: string;
  stateIndex: string;
  voiceCredits: string;
  timestamp: string;
}

interface CheckJoinStatusResult {
  isJoined: boolean;
  pollStateIndex: string | null;
  voiceCredits: string | null;
  source: "subgraph" | "localStorage" | "none";
}

/**
 * Get the subgraph URL from environment or localStorage
 */
const getSubgraphUrl = (): string | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("subgraphUrl");
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_SUBGRAPH_URL || null;
};

/**
 * Query to check if a user has joined a specific poll
 * Uses the user's public key coordinates to search for PollJoined events
 */
const buildPollJoinedQuery = (pubKeyX: string, pubKeyY: string, pollId: string) => `
  query CheckPollJoined {
    pollJoineds(
      where: {
        pubKeyX: "${pubKeyX}",
        pubKeyY: "${pubKeyY}",
        pollId: "${pollId}"
      },
      first: 1
    ) {
      id
      pollId
      stateIndex
      voiceCredits
      timestamp
      blockNumber
    }
  }
`;

/**
 * Alternative query using voterPubKey (combined key) if subgraph stores it that way
 */
const buildPollJoinedQueryAlt = (pubKey: string, pollId: string) => `
  query CheckPollJoined {
    pollJoineds(
      where: {
        voterPubKey: "${pubKey}",
        pollId: "${pollId}"
      },
      first: 1
    ) {
      id
      pollId
      stateIndex
      voiceCredits
      timestamp
    }
  }
`;

/**
 * Alternative query for polls using stateLeaves (if subgraph uses this pattern)
 */
const buildStateLeafQuery = (pubKeyHash: string, pollId: string) => `
  query CheckStateLeaf {
    stateLeaves(
      where: {
        pubKeyHash: "${pubKeyHash}",
        poll_: { pollId: "${pollId}" }
      },
      first: 1
    ) {
      id
      stateIndex
      voiceCreditBalance
    }
  }
`;

/**
 * Hook to check if a user has joined a specific poll
 * 
 * Priority:
 * 1. Query subgraph for definitive on-chain status
 * 2. Fall back to poll-specific localStorage key
 * 3. Return not joined if no data found
 */
export const useCheckJoinStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check join status from subgraph
   */
  const checkFromSubgraph = async (
    pubKeyX: string,
    pubKeyY: string,
    pollId: string
  ): Promise<CheckJoinStatusResult> => {
    const subgraphUrl = getSubgraphUrl();

    if (!subgraphUrl) {
      console.warn("No subgraph URL configured, falling back to localStorage");
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }

    try {
      const query = buildPollJoinedQuery(pubKeyX, pubKeyY, pollId);

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
        // Try alternative query format
        return await tryAlternativeQuery(pubKeyX, pubKeyY, pollId, subgraphUrl);
      }

      const pollJoineds = json.data?.pollJoineds;

      if (pollJoineds && pollJoineds.length > 0) {
        const joined = pollJoineds[0];
        return {
          isJoined: true,
          pollStateIndex: joined.stateIndex,
          voiceCredits: joined.voiceCredits,
          source: "subgraph",
        };
      }

      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "subgraph" };

    } catch (err: any) {
      console.error("Subgraph query failed:", err);
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }
  };

  /**
   * Try alternative query formats if first one fails
   */
  const tryAlternativeQuery = async (
    pubKeyX: string,
    pubKeyY: string,
    pollId: string,
    subgraphUrl: string
  ): Promise<CheckJoinStatusResult> => {
    try {
      // Try with combined pubKey format
      const combinedKey = `${pubKeyX} ${pubKeyY}`;
      const query = buildPollJoinedQueryAlt(combinedKey, pollId);

      const response = await fetch(subgraphUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();

      if (!json.errors && json.data?.pollJoineds?.length > 0) {
        const joined = json.data.pollJoineds[0];
        return {
          isJoined: true,
          pollStateIndex: joined.stateIndex,
          voiceCredits: joined.voiceCredits,
          source: "subgraph",
        };
      }
    } catch (err) {
      console.warn("Alternative subgraph query also failed:", err);
    }

    return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
  };

  /**
   * Check join status from localStorage (poll-specific key)
   */
  const checkFromLocalStorage = (pollId: string): CheckJoinStatusResult => {
    if (typeof window === "undefined") {
      return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
    }

    // Try poll-specific key first (new format)
    const pollSpecificIndex = localStorage.getItem(`maci_poll_state_index_${pollId}`);
    const pollSpecificCredits = localStorage.getItem(`maci_voice_credits_${pollId}`);

    if (pollSpecificIndex) {
      return {
        isJoined: true,
        pollStateIndex: pollSpecificIndex,
        voiceCredits: pollSpecificCredits,
        source: "localStorage",
      };
    }

    // Fall back to generic key (old format) - but this is unreliable for multi-poll
    const genericIndex = localStorage.getItem("maci_poll_state_index");
    const genericCredits = localStorage.getItem("maci_voice_credits");

    if (genericIndex) {
      console.warn("Using generic localStorage key - may not be for this specific poll!");
      return {
        isJoined: true,
        pollStateIndex: genericIndex,
        voiceCredits: genericCredits,
        source: "localStorage",
      };
    }

    return { isJoined: false, pollStateIndex: null, voiceCredits: null, source: "none" };
  };

  /**
   * Main check function - tries subgraph first, then localStorage
   */
  const checkJoinStatus = useCallback(async (
    pollId: string,
    pubKeyX?: string,
    pubKeyY?: string
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
      }

      // Fall back to localStorage
      const localResult = checkFromLocalStorage(pollId);
      return localResult;

    } catch (err: any) {
      console.error("Check join status failed:", err);
      setError(err.message);
      // Return localStorage result as fallback
      return checkFromLocalStorage(pollId);
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
