"use client";

import { useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@sasvoth/ui/dialog";
import { useMaci } from "@/hooks";
import { useFeedback } from "@/contexts/FeedbackContext";

// Dynamic imports for crypto libraries to avoid SSR issues
// Note: In Next.js 16/React 19 we might handle this differently but sticking to working pattern
import dynamic from "next/dynamic";

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
  const [privKey, setPrivKey] = useState("");
  const [useRandomKey, setUseRandomKey] = useState(true);
  const [useExistingKey, setUseExistingKey] = useState(false);

  // ... (state logic remains same) ...
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [existingPollStateIndex, setExistingPollStateIndex] = useState<string | null>(null);
  const [existingVoiceCredits, setExistingVoiceCredits] = useState<string | null>(null);

  const [joinSuccess, setJoinSuccess] = useState(false);
  const [newPollStateIndex, setNewPollStateIndex] = useState<string | null>(null);
  const [newVoiceCredits, setNewVoiceCredits] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const storedPollStateIndex = localStorage.getItem("maci_poll_state_index");
      const storedVoiceCredits = localStorage.getItem("maci_voice_credits");
      const storedPrivKey = localStorage.getItem("maci_priv_key");

      if (storedPollStateIndex) {
        setAlreadyJoined(true);
        setExistingPollStateIndex(storedPollStateIndex);
        setExistingVoiceCredits(storedVoiceCredits);
      } else {
        setAlreadyJoined(false);
        setExistingPollStateIndex(null);
        setExistingVoiceCredits(null);

        if (storedPrivKey) {
          setUseExistingKey(true);
          setUseRandomKey(false);
        } else {
          setUseExistingKey(false);
          setUseRandomKey(true);
        }
      }
      setJoinSuccess(false);
      setNewPollStateIndex(null);
      setNewVoiceCredits(null);
    }
  }, [open]);

  const handleSignup = async () => {
    // ... (logic remains same) ...
    if (alreadyJoined) return;

    try {
      if (useExistingKey) {
        // ... existing key logic
      } else if (useRandomKey) {
        await signupToMaci();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        // ... manual key logic
        if (!privKey) {
           showError("Missing Key", "Enter secret key or use random generation");
           return;
        }
        let finalKey = privKey.trim();
        if (!finalKey.startsWith("macisk")) {
           const { PrivateKey } = await import("@maci-protocol/domainobjs");
           const rawPKey = PrivateKey.deserialize(finalKey);
           finalKey = rawPKey.serialize();
        }
        localStorage.setItem("maci_priv_key", finalKey);
        const { PrivateKey, Keypair } = await import("@maci-protocol/domainobjs");
        const pKey = PrivateKey.deserialize(finalKey);
        const kPair = new Keypair(pKey);
        localStorage.setItem("maci_pub_key", kPair.publicKey.serialize());
      }

      const joinResult = await joinMaciPoll(String(pollIdOnChain), 0, "", 0);

      if (joinResult.alreadyJoined) {
        showSuccess("Already Joined", "Note: You have already joined this poll! treating as success.");
      }

      setJoinSuccess(true);
      setNewPollStateIndex(joinResult.pollStateIndex || null);
      setNewVoiceCredits(joinResult.voiceCredits || null);

      if (joinResult.pollStateIndex) localStorage.setItem("maci_poll_state_index", joinResult.pollStateIndex);
      if (joinResult.voiceCredits) localStorage.setItem("maci_voice_credits", joinResult.voiceCredits);

      onSuccess();
    } catch (e: any) {
      console.error("Signup/Join failed", e);
      showError("Signup/Join Failed", e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="rounded-[32px] border-2 border-black sm:max-w-md bg-white p-6">
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
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-1 rounded">
                    Poll State Index: {newPollStateIndex || "N/A"}
                  </p>
                  {newVoiceCredits && (
                    <p className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-1 rounded">
                      Voice Credits: {newVoiceCredits}
                    </p>
                  )}
                </div>
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
