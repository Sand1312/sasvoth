"use client";

import { useState, useMemo } from "react";
import { Button } from "@sasvoth/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@sasvoth/ui/dialog";
import { Input } from "@sasvoth/ui/input";
import { useAccount } from "wagmi";
import { usePolls } from "@/hooks";

interface CreatePollDialogProps {
  onSuccess?: () => void;
}

export function CreatePollDialog({ onSuccess }: CreatePollDialogProps) {
  const { address } = useAccount();
  const { initPoll } = usePolls();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Poll Configuration (from DeployPollPayload)
  const [maxOptions, setMaxOptions] = useState(4);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Advanced MACI Config
  const [mode, setMode] = useState(1); // 1 = QV
  const [messageBatchSize, setMessageBatchSize] = useState(20);
  const [pollStateTreeDepth, setPollStateTreeDepth] = useState(10);
  const [voteOptionTreeDepth, setVoteOptionTreeDepth] = useState(2);
  const [tallyProcessingStateTreeDepth, setTallyProcessingStateTreeDepth] = useState(1);
  const [initialVoiceCredits, setInitialVoiceCredits] = useState(100);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    if (!startTime) e.startTime = "Start time is required";
    if (!endTime) e.endTime = "End time is required";

    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;
    if (start && end && end <= start) e.endTime = "End must be after start";

    if (maxOptions < 2) e.maxOptions = "At least 2 options required";
    if (messageBatchSize < 1) e.messageBatchSize = "Must be at least 1";
    if (pollStateTreeDepth < 1) e.pollStateTreeDepth = "Must be at least 1";
    if (voteOptionTreeDepth < 1) e.voteOptionTreeDepth = "Must be at least 1";

    return e;
  }, [title, description, startTime, endTime, maxOptions, messageBatchSize, pollStateTreeDepth, voteOptionTreeDepth]);

  const isValid = Object.keys(errors).length === 0;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMaxOptions(4);
    setStartTime("");
    setEndTime("");
    setMode(1);
    setMessageBatchSize(20);
    setPollStateTreeDepth(10);
    setVoteOptionTreeDepth(2);
    setTallyProcessingStateTreeDepth(1);
    setInitialVoiceCredits(100);
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!isValid) return;
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Create poll in database with all MACI config
      await initPoll(
        title,
        description,
        address,
        maxOptions,
        new Date(startTime),
        new Date(endTime),
        // Extended config stored in DB for deployment
        {
          mode,
          messageBatchSize,
          pollStateTreeDepth,
          voteOptionTreeDepth,
          tallyProcessingStateTreeDepth,
          initialVoiceCredits,
        }
      );

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create poll:", error);
      alert("Failed to create poll. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Create Poll</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border shadow-xl">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
          <DialogDescription>
            Configure your MACI poll settings. Advanced options use sensible defaults.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Basic Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Poll title"
                className={submitted && errors.title ? "border-red-500" : ""}
              />
              {submitted && errors.title && (
                <p className="text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Poll description"
                rows={3}
                className={`w-full border px-3 py-2 rounded-md ${
                  submitted && errors.description ? "border-red-500" : "border-slate-300"
                }`}
              />
              {submitted && errors.description && (
                <p className="text-xs text-red-500">{errors.description}</p>
              )}
            </div>
          </section>

          {/* Time Configuration */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Schedule
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={submitted && errors.startTime ? "border-red-500" : ""}
                />
                {submitted && errors.startTime && (
                  <p className="text-xs text-red-500">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={submitted && errors.endTime ? "border-red-500" : ""}
                />
                {submitted && errors.endTime && (
                  <p className="text-xs text-red-500">{errors.endTime}</p>
                )}
              </div>
            </div>
          </section>

          {/* Poll Options */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Poll Options
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Vote Options</label>
                <Input
                  type="number"
                  min={2}
                  value={maxOptions}
                  onChange={(e) => setMaxOptions(Number(e.target.value))}
                  className={submitted && errors.maxOptions ? "border-red-500" : ""}
                />
                <p className="text-xs text-slate-500">
                  Number of vote options in the poll
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Voting Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(Number(e.target.value))}
                  className="w-full border border-slate-300 px-3 py-2 rounded-md"
                >
                  <option value={0}>Non-QV (Simple)</option>
                  <option value={1}>QV (Quadratic Voting)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Voice Credits</label>
              <Input
                type="number"
                min={1}
                value={initialVoiceCredits}
                onChange={(e) => setInitialVoiceCredits(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                Voice credits each voter starts with
              </p>
            </div>
          </section>

          {/* Advanced MACI Config */}
          <section className="space-y-4">
            <details className="group">
              <summary className="text-sm font-semibold uppercase tracking-wide text-slate-500 cursor-pointer list-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Advanced MACI Configuration
              </summary>

              <div className="mt-4 grid grid-cols-2 gap-4 pl-4 border-l-2 border-slate-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Batch Size</label>
                  <Input
                    type="number"
                    min={1}
                    value={messageBatchSize}
                    onChange={(e) => setMessageBatchSize(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-400">Default: 20</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Poll State Tree Depth</label>
                  <Input
                    type="number"
                    min={1}
                    value={pollStateTreeDepth}
                    onChange={(e) => setPollStateTreeDepth(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-400">Default: 10</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vote Option Tree Depth</label>
                  <Input
                    type="number"
                    min={1}
                    value={voteOptionTreeDepth}
                    onChange={(e) => setVoteOptionTreeDepth(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-400">Default: 2</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tally Processing Depth</label>
                  <Input
                    type="number"
                    min={1}
                    value={tallyProcessingStateTreeDepth}
                    onChange={(e) => setTallyProcessingStateTreeDepth(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-400">Default: 1</p>
                </div>
              </div>
            </details>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!isValid && submitted) || !address}>
              {loading ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
