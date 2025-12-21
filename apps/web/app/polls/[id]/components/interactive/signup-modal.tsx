"use client";

import { useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@sasvoth/ui/dialog";
import { useMaci } from "@/hooks";
import { useFeedback } from "@/contexts/FeedbackContext";
import { useCheckJoinStatus } from "@/hooks/useCheckJoinStatus";
import { hasCachedMaciKeypair, getCachedMaciKeypair } from "@/utils/maciKeyDerivation";
import { useAccount, useChainId } from "wagmi";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pollId: string;
  pollIdOnChain: number;
};

export function SignupModal({
  open,
  onClose,
  onSuccess,
  pollId,
  pollIdOnChain,
}: SignupModalProps) {
  const { showSuccess, showError } = useFeedback();
  const { signupToMaci, joinMaciPoll, loading } = useMaci();
  const { checkJoinStatus, loading: checkingStatus } = useCheckJoinStatus();
  const { address } = useAccount();
  const chainId = useChainId();

  const [privKey, setPrivKey] = useState("");
  const [useRandomKey, setUseRandomKey] = useState(true);
  const [useExistingKey, setUseExistingKey] = useState(false);

  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [existingPollStateIndex, setExistingPollStateIndex] = useState<string | null>(null);
  const [existingVoiceCredits, setExistingVoiceCredits] = useState<string | null>(null);
  const [statusSource, setStatusSource] = useState<"subgraph" | "localStorage" | "none">("none");

  const [joinSuccess, setJoinSuccess] = useState(false);
  const [newPollStateIndex, setNewPollStateIndex] = useState<string | null>(null);
  const [newVoiceCredits, setNewVoiceCredits] = useState<string | null>(null);

  // Check join status when modal opens
  useEffect(() => {
    const checkStatus = async () => {
      if (!open || !address) return;

      // Reset state
      setJoinSuccess(false);
      setNewPollStateIndex(null);
      setNewVoiceCredits(null);

      // Check if keypair is cached in memory
      const hasExistingKey = hasCachedMaciKeypair(address, chainId);

      // Get user's public key coordinates for subgraph query
      let coords: { x: string; y: string } | null = null;
      if (hasExistingKey) {
        const cached = getCachedMaciKeypair(address, chainId);
        if (cached) {
          coords = { x: cached.pubKeyX, y: cached.pubKeyY };
        }
      }

      // Check join status (subgraph first)
      const pollIdStr = String(pollIdOnChain);
      const result = await checkJoinStatus(
        pollIdStr,
        coords?.x,
        coords?.y
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

        if (hasExistingKey) {
          setUseExistingKey(true);
          setUseRandomKey(false);
        } else {
          setUseExistingKey(false);
          setUseRandomKey(true);
        }
      }
    };

    checkStatus();
  }, [open, pollIdOnChain, checkJoinStatus, address, chainId]);

  const handleSignup = async () => {
    if (alreadyJoined) return;

    try {
      if (useExistingKey) {
        // Existing key is cached in memory - signupToMaci will use it
      } else if (useRandomKey) {
        await signupToMaci();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        // Manual key logic - not recommended but kept for backward compatibility
        if (!privKey) {
          showError("Missing Key", "Enter secret key or use random generation");
          return;
        }
        // Note: Manual key mode is deprecated. Keys are now derived from wallet signature.
        showError("Deprecated", "Manual key entry is no longer supported. Please use 'Generate new keypair' option.");
        return;
      }

      const joinResult = await joinMaciPoll(String(pollIdOnChain), 0, "", 0);

      // Note: Don't show feedback modal for alreadyJoined - Dialog handles it
      // showSuccess would create nested modals

      setJoinSuccess(true);
      setNewPollStateIndex(joinResult.pollStateIndex || null);
      setNewVoiceCredits(joinResult.voiceCredits || null);

      // Note: No localStorage needed - useMaciVote now gets stateIndex from chain

      onSuccess();
    } catch (e: any) {
      console.error("Signup/Join failed", e);
      showError("Signup/Join Failed", e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-[32px] border-2 border-black sm:max-w-md !bg-white p-6 z-[100]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center sm:text-left">Join Poll</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {joinSuccess ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-emerald-800 font-semibold">Successfully Joined!</p>
                </div>
                <p className="text-sm text-emerald-600 mt-1">You are now registered to vote.</p>
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
                <Button onClick={onClose} className="bg-emerald-600 text-white rounded-full px-6 hover:bg-emerald-700">
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
                <Button onClick={onClose} variant="ghost">Close</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">Generate or provide a MACI identity to participate.</p>

              {useExistingKey ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-semibold">Existing Identity Found</p>
                  <p className="text-xs text-blue-600 mt-1">Your saved MACI Key will be used to join this poll.</p>
                  <button
                    onClick={() => {
                      setUseExistingKey(false);
                      setUseRandomKey(true);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700 underline mt-2"
                  >
                    Use a different key
                  </button>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRandomKey}
                      onChange={(e) => setUseRandomKey(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Generate new random keypair</span>
                  </label>

                  {!useRandomKey && (
                    <input
                      type="password"
                      placeholder="Secret Key"
                      value={privKey}
                      onChange={(e) => setPrivKey(e.target.value)}
                      className="border-2 border-black rounded-lg px-4 py-2 w-full"
                    />
                  )}

                  <button
                    onClick={() => setUseExistingKey(true)}
                    className="text-xs text-gray-400 hover:text-black underline self-start"
                  >
                    Back to existing key
                  </button>
                </>
              )}

              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={onClose} variant="ghost">Cancel</Button>
                <Button onClick={handleSignup} disabled={loading} className="bg-black text-white rounded-full px-6">
                  {loading ? "Joining..." : "Join Poll"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
