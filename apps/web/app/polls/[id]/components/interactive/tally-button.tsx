"use client";

import { useState } from "react";
import { useMaci } from "@/hooks";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Spinner } from "@sasvoth/ui/spinner";

type TallyButtonProps = {
  onChainId: string;
  resultsCount: number;
  status: string;
  pollId: string; // Internal DB ID needed for updating status?
  maciAddress?: string; // From poll data
  startBlock?: number; // From API/poll data
};

export function TallyButton({
  onChainId,
  resultsCount,
  status,
  pollId,
  maciAddress: maciAddressProp,
  startBlock: startBlockProp,
}: TallyButtonProps) {
  const [devTallying, setDevTallying] = useState(false);
  const [devTallyStatus, setDevTallyStatus] = useState("");
  const { mergePoll, generateProofs, submitProofs } = useMaci();
  const { showSuccess, showError } = useFeedback();

  const handleDevTally = async () => {
    if (!onChainId || onChainId === "" || onChainId === "0") {
      alert("Poll ID (On-Chain) not found");
      return;
    }
    if (
      !confirm(
        "This will trigger MACI Tallying (Merge -> Prove -> Submit). It may take a long time. Continue?"
      )
    ) {
      return;
    }
    // Use maciAddress from prop (poll DB) with localStorage fallback for dev
    const maciAddress = maciAddressProp ||
      (typeof window !== "undefined" ? localStorage.getItem("maciAddress") || undefined : undefined);
    const startBlock = startBlockProp ||
      (typeof window !== "undefined"
        ? Number(localStorage.getItem("maciStartBlock") || "0")
        : 0);

    if (!maciAddress) {
      if (
        !confirm(
          "MACI Address not found. Make sure poll has maciAddress saved. Continue with server default?"
        )
      ) {
        return;
      }
    }

    setDevTallying(true);
    try {
      setDevTallyStatus("Merging Poll...");
      await mergePoll(onChainId, maciAddress);

      setDevTallyStatus("Generating Proofs (this takes time)...");
      await generateProofs(onChainId, maciAddress, startBlock);

      setDevTallyStatus("Submitting Proofs...");
      await submitProofs(onChainId, maciAddress);

      setDevTallyStatus("Done!");
      showSuccess("Tally Completed", "Refreshing...");
      window.location.reload();
    } catch (e: any) {
      console.error("Failed to tally votes:", e);
      showError(
        "Tally Failed",
        e instanceof Error ? e.message : "Failed to tally votes"
      );
      setDevTallyStatus("Failed.");
    } finally {
      setDevTallying(false);
    }
  };

  return (
    <div className="bg-yellow-50 p-4 rounded-lg text-sm border border-yellow-200">
      <div className="font-semibold text-yellow-800 mb-2">Dev: Poll Debug</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span>MACI:</span>
          <span className="font-mono text-xs bg-white px-2 py-1 rounded border truncate max-w-[200px]">
            {maciAddressProp ||
              (typeof window !== "undefined"
                ? localStorage.getItem("maciAddress") || "Not set"
                : "...")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Poll ID (On-Chain):</span>
          <span className="font-mono bg-white px-2 py-1 rounded border">
            {onChainId !== undefined &&
              onChainId !== null &&
              onChainId !== ""
              ? onChainId
              : "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <span className="font-mono bg-white px-2 py-1 rounded border">
            {status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Results:</span>
          <span className="font-mono bg-white px-2 py-1 rounded border">
            {resultsCount} items
          </span>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-yellow-300 mt-2">
          <span>Tally:</span>
          {devTallying && (
            <span className="text-xs font-mono text-emerald-600 animate-pulse">
              {devTallyStatus}
            </span>
          )}
          <button
            onClick={handleDevTally}
            disabled={
              devTallying ||
              !onChainId || onChainId === "" || onChainId === "0"
            }
            className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {devTallying ? (
              <>
                <Spinner className="text-white" />
                Tallying...
              </>
            ) : (
              "Tally Results (Dev)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
