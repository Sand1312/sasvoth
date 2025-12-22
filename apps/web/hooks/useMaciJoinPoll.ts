import { useState } from "react";
import { useSignTypedData, useAccount, useChainId, usePublicClient } from "wagmi";
import { maciApi } from "../api/maci.api";
import { deriveMaciKeypair } from "../utils/maciKeyDerivation";
import { useMaciStore, useWithMaciLock } from "@/stores/maciStore";
import { useCheckJoinStatus } from "./useCheckJoinStatus";

export const useMaciJoinPoll = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  
  // Zustand store integration
  const { setKeypair, getKeypair } = useMaciStore();
  const { withLock, isLocked } = useWithMaciLock();
  
  // Graph/localStorage pre-check for join status (ACID: Consistency)
  const { checkJoinStatus } = useCheckJoinStatus();

  const handleJoinPoll = async (maciAddress: string, pollId: string, startBlock?: number) => {
    if (!address) {
      setError("Wallet not connected");
      return { success: false, error: "Wallet not connected" };
    }

    // Wrap entire join in lock to prevent double-click races
    try {
      return await withLock('join', address, pollId, async () => {
        setLoading(true);
        setError(null);
        
        try {
          // ============================================
          // Step 1: Derive MACI keypair (cached in Zustand store)
          // ============================================
          console.log("Deriving MACI keypair...");
          const { privateKey, pubKeyX, pubKeyY } = await deriveMaciKeypair(
            address,
            chainId,
            signTypedDataAsync,
            {
              maciAddress,
              // Zustand store integration
              getFromStore: () => getKeypair(address, chainId, maciAddress),
              setToStore: (kp) => setKeypair(address, chainId, kp, maciAddress),
            }
          );

          // ============================================
          // Step 1.5: Check if already joined (ACID: Consistency + Atomicity)
          // Graph first, localStorage fallback - skip expensive API if already joined
          // ============================================
          console.log("🔍 Checking if already joined poll...");
          try {
            // Pass maciAddress and publicClient for RPC chain fallback
            const joinResult = await checkJoinStatus(pollId, pubKeyX, pubKeyY, maciAddress, publicClient);
            
            if (joinResult.isJoined) {
              console.log(`✅ Already joined poll ${pollId}! Source: ${joinResult.source}`);
              return {
                success: true,
                alreadyJoined: true,
                pollStateIndex: joinResult.pollStateIndex || "0",
                voiceCredits: joinResult.voiceCredits || "0",
                hash: null,
              };
            }
            console.log("❌ Not joined yet, proceeding with API call...");
          } catch (checkErr) {
            console.warn("Could not check join status, proceeding with API call:", checkErr);
          }

          // ============================================
          // Step 2: Determine startBlock for Merkle tree
          // ============================================
          let effectiveStartBlock = startBlock || 0;

      // Fetch from API if not provided
      if (!effectiveStartBlock) {
        try {
          const deployment = await maciApi.getLatestDeployment();
          effectiveStartBlock = deployment.startBlock || 0;
          console.log("Using startBlock from API:", effectiveStartBlock);
        } catch (err) {
          console.warn("Could not fetch startBlock from API, using hardcoded fallback");
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

      // If alreadyJoined and pollStateIndex is 0, it means backend couldn't get the real index
      // This is expected behavior - the user is already joined, just poll index wasn't returned
      // Frontend can query separately if needed

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
      });
    } catch (lockErr: any) {
      // Lock acquisition failed (another operation in progress)
      console.warn("JoinPoll blocked:", lockErr.message);
      setError(lockErr.message);
      return { success: false, error: lockErr.message };
    }
  };

  return {
    joinPoll: handleJoinPoll,
    loading,
    error,
    isLocked,
  };
};

