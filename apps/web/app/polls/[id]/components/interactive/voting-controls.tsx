"use client";

import { useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import { useMaci } from "@/hooks";
import { useFeedback } from "@/contexts/FeedbackContext";
import { SignupModal } from "./signup-modal";
import { Spinner } from "@sasvoth/ui/spinner";

type VotingControlsProps = {
  credits: { spent: number; total: number; remaining?: number };
  pollId: string;
  pollIdOnChain: string;
  maciAddress?: string;
  startBlock?: number;
};

export function VotingControls({
  credits,
  pollId,
  pollIdOnChain,
  maciAddress,
  startBlock,
}: VotingControlsProps) {
  const [showSignup, setShowSignup] = useState(false);
  const { signupToMaci, loading } = useMaci();
  const { showSuccess, showError } = useFeedback();

  // Check if joined - check for pollStateIndex (preferred) or stateIndex (backward compat)
  const [isJoined, setIsJoined] = useState(false);
  const [joinedPollStateIndex, setJoinedPollStateIndex] = useState<
    string | null
  >(null);

  useEffect(() => {
    // User requested to NOT rely on local state for "Joined" status automatically.
    // Keeping logic consistent with previous implementation.
  }, []);

  // Handle MACI signup only (separate from join poll)
  const handleMaciSignup = async () => {
    if (!maciAddress) {
      showError(
        "Missing MACI Address",
        "Poll doesn't have a MACI address configured.",
      );
      return;
    }

    try {
      console.log("Signing up to MACI with address:", maciAddress);
      const result = await signupToMaci(maciAddress, startBlock);
      console.log("MACI Signup successful:", result);
      showSuccess(
        "MACI Signup",
        `Signup successful! State Index: ${result.stateIndex}`,
      );
    } catch (error: any) {
      console.error("MACI Signup failed:", error);
      showError("Signup Failed", error.message);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Spend credit
          </p>
          <p className="text-3xl font-semibold">
            {credits.spent}{" "}
            <span className="text-black/40">/ {credits.total}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-[0.3em] sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleMaciSignup}
            disabled={loading || !maciAddress}
            className="rounded-full border border-purple-500 px-6 py-3 text-purple-700 hover:bg-purple-50 flex items-center gap-2"
          >
            {loading && <Spinner />}
            Sign Up to MACI
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowSignup(true)}
            disabled={!maciAddress}
            className={`rounded-full border px-6 py-3 ${
              isJoined
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-black text-black hover:bg-black/5"
            }`}
          >
            {isJoined
              ? `Joined (#${joinedPollStateIndex})`
              : "Join Poll (Sign Up)"}
          </Button>
        </div>
      </div>

      <SignupModal
        open={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={() => setIsJoined(true)}
        pollId={pollId}
        pollIdOnChain={Number(pollIdOnChain)}
        maciAddress={maciAddress || ""}
        startBlock={startBlock}
      />
    </>
  );
}
