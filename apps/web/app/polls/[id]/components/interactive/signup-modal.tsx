"use client";

import { useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sasvoth/ui/dialog";
import { useMaci } from "@/hooks";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useCheckJoinStatus } from "@/hooks/useCheckJoinStatus";
import { useMaciStore } from "@/stores/maciStore";
import { useAccount, useChainId, usePublicClient } from "wagmi";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pollId: string;
  pollIdOnChain: number;
  maciAddress: string; // Required - from poll data
  startBlock?: number; // Optional - from poll data
};

export function SignupModal({
  open,
  onClose,
  onSuccess,
  pollId,
  pollIdOnChain,
  maciAddress,
  startBlock,
}: SignupModalProps) {
  const { showSuccess, showError } = useFeedback();
  const { signupToMaci, joinMaciPoll, loading } = useMaci();
  const { checkJoinStatus, loading: checkingStatus } = useCheckJoinStatus();
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // Zustand store integration
  const { hasKeypair, getKeypair, isLocked } = useMaciStore();

  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [existingPollStateIndex, setExistingPollStateIndex] = useState<
    string | null
  >(null);
  const [existingVoiceCredits, setExistingVoiceCredits] = useState<
    string | null
  >(null);
  const [statusSource, setStatusSource] = useState<
    "subgraph" | "chain" | "none"
  >("none");

  const [joinSuccess, setJoinSuccess] = useState(false);
  const [newPollStateIndex, setNewPollStateIndex] = useState<string | null>(
    null,
  );
  const [newVoiceCredits, setNewVoiceCredits] = useState<string | null>(null);

  // Check if user has existing keypair
  const hasExistingKey = address
    ? hasKeypair(address, chainId, maciAddress)
    : false;

  // Check join status when modal opens
  useEffect(() => {
    const checkStatus = async () => {
      if (!open || !address) return;

      // Reset state
      setJoinSuccess(false);
      setNewPollStateIndex(null);
      setNewVoiceCredits(null);

      // Get user's public key coordinates for subgraph query
      let coords: { x: string; y: string } | null = null;
      if (hasExistingKey) {
        const cached = getKeypair(address, chainId, maciAddress);
        if (cached) {
          coords = { x: cached.pubKeyX, y: cached.pubKeyY };
        }
      }

      // Check join status (subgraph first, then RPC fallback)
      const pollIdStr = String(pollIdOnChain);
      const result = await checkJoinStatus(
        pollIdStr,
        coords?.x,
        coords?.y,
        maciAddress, // From prop (poll data)
        publicClient, // For RPC fallback
      );

      console.log(`[SignupModal] Join status for poll ${pollIdStr}:`, result);

      if (result.isJoined) {
        setAlreadyJoined(true);
        setExistingPollStateIndex(result.pollStateIndex);
        setExistingVoiceCredits(result.voiceCredits);
        setStatusSource(result.source);
      } else {
        setAlreadyJoined(false);
        setExistingPollStateIndex(null);
        setExistingVoiceCredits(null);
        setStatusSource("none");
      }
    };

    checkStatus();
  }, [
    open,
    pollIdOnChain,
    checkJoinStatus,
    address,
    chainId,
    publicClient,
    maciAddress,
    hasKeypair,
    getKeypair,
    hasExistingKey,
  ]);

  const handleSignup = async () => {
    if (alreadyJoined) return;

    if (!hasExistingKey) {
      showError(
        "No MACI Key",
        "Please sign up to MACI first to generate your identity.",
      );
      return;
    }

    console.log("maci address", maciAddress);
    try {
      const pollIdStr = String(pollIdOnChain);

      // 🔍 DEBUG: Log poll IDs before calling join
      console.log(`🔍 [SignupModal] handleSignup - about to join poll:`, {
        pollId_prop: pollId,
        pollIdOnChain_prop: pollIdOnChain,
        pollIdStr_used: pollIdStr,
        maciAddress_prop: maciAddress?.slice(0, 15) + "...",
      });

      const joinResult = await joinMaciPoll(pollIdStr, 0, "", 0, maciAddress);

      setJoinSuccess(true);
      setNewPollStateIndex(joinResult.pollStateIndex || null);
      setNewVoiceCredits(joinResult.voiceCredits || null);

      onSuccess();
    } catch (e: any) {
      console.error("Join Poll failed", e);
      // Handle lock errors gracefully
      if (e.message?.includes("another MACI operation")) {
        showError(
          "Please Wait",
          "Another operation is in progress. Please wait.",
        );
        return;
      }
      showError("Join Poll Failed", e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-[32px] border-2 border-black sm:max-w-md !bg-white p-6 z-[100]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center sm:text-left">
            Join Poll
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {joinSuccess ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-emerald-800 font-semibold">
                    Successfully Joined!
                  </p>
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  You are now registered to vote.
                </p>
                {/* Only show stats if they have meaningful values */}
                {newPollStateIndex && newPollStateIndex !== "0" && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-1 rounded">
                      Poll State Index: {newPollStateIndex}
                    </p>
                    {newVoiceCredits && newVoiceCredits !== "0" && (
                      <p className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-1 rounded">
                        Voice Credits: {newVoiceCredits}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={onClose}
                  className="bg-emerald-600 text-white rounded-full px-6 hover:bg-emerald-700"
                >
                  Done
                </Button>
              </div>
            </>
          ) : alreadyJoined ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-800 font-semibold">Already Joined</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-1 rounded">
                    Poll State Index: {existingPollStateIndex}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={onClose} variant="ghost">
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              {hasExistingKey ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-semibold">
                    MACI Identity Found
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Your saved MACI Key will be used to join this poll.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-semibold">
                    No MACI Identity
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please click &quot;Sign Up to MACI&quot; first to generate
                    your identity before joining the poll.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={onClose} variant="ghost">
                  Cancel
                </Button>
                <Button
                  onClick={handleSignup}
                  disabled={loading || isLocked() || !hasExistingKey}
                  className="bg-black text-white rounded-full px-6"
                >
                  {loading
                    ? "Joining..."
                    : isLocked()
                      ? "Processing..."
                      : "Join Poll"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
