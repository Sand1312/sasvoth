"use client";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import { useAccount } from "wagmi";
import { usePolls } from "../../../hooks/usePolls";
type VoteOption = { id: string; label: string };

function PlusIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function CreatePollPage() {
  const { address } = useAccount();
  
  const { initPoll } = usePolls();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  // const [treeDepth, setTreeDepth] = useState<string>("");
  // const [batchSize, setBatchSize] = useState<string>("");
  // const [initVoiceCredit, setInitVoiceCredit] = useState<string>("");
  // Instead of collecting labels for each option, we accept a number
  // representing how many anonymous options the poll should have.
  const [numberOptions, setNumberOptions] = useState<number>(2);
  const [submitted, setSubmitted] = useState(false);


  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!title || title.trim().length === 0) e.title = "Title is required";
    if (!description || description.trim().length === 0)
      e.description = "Description is required";
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (!startTime) e.startTime = "Start time is required";
    if (!endTime) e.endTime = "End time is required";
    if (start && end && end <= start) e.endTime = "End must be after start";

    // const td = Number(treeDepth);
    // if (!treeDepth) e.treeDepth = "Tree depth is required";
    // else if (!Number.isInteger(td) || td < 1)
    //   e.treeDepth = "Tree depth must be a positive integer";

    // const bs = Number(batchSize);
    // if (!batchSize) e.batchSize = "Batch size is required";
    // else if (!Number.isInteger(bs) || bs < 1)
    //   e.batchSize = "Batch size must be a positive integer";

    // const vc = Number(initVoiceCredit);
    // if (initVoiceCredit === "")
    //   e.initVoiceCredit = "Initial voice credit is required";
    // else if (!isFinite(vc) || vc < 0)
    //   e.initVoiceCredit = "Initial voice credit must be ≥ 0";

    if (!Number.isInteger(numberOptions) || numberOptions < 2)
      e.options = "At least two options are required";

    return e;
  }, [title, description, startTime, endTime, numberOptions]);


  const isValid = Object.keys(errors).length === 0;

  // option add/remove/update removed — the form now takes only `numberOptions`.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    if (!isValid) {
      console.log(" Form validation failed:", errors);
      return;
    }
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log(" Starting poll creation...");

     

      await initPoll(
        title,
        description,
        address,
        numberOptions,
        new Date(startTime),
        new Date(endTime),
      );
  
    } catch (error) {
      console.error(" Failed to create poll:", error);
      alert("Failed to create poll. Check console for details.");
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 text-black bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">New Vote</h1>
        <a
          href="/admin/dashboard"
          className="rounded-none border border-black bg-white px-3 py-2 text-sm text-black hover:bg-black hover:text-white"
        >
          ← Back to Dashboard
        </a>
      </div>



      {/* Wallet Not Connected */}
      {!address && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Please connect your wallet to create a poll
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <Field label="Title" error={submitted ? errors.title : ""}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass(submitted && !!errors.title)}
            />
          </Field>

          <Field
            label="Description"
            error={submitted ? errors.description : ""}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass(submitted && !!errors.description)}
              rows={3}
            />
          </Field>

          <Field label="Creator address">
            <input
              type="text"
              value={address ?? "Not connected"}
              readOnly
              className={inputClass(!address)}
            />
          </Field>

          <Field label="Start time" error={submitted ? errors.startTime : ""}>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass(submitted && !!errors.startTime)}
            />
          </Field>

          <Field label="End time" error={submitted ? errors.endTime : ""}>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass(submitted && !!errors.endTime)}
              // disabled={isDeployingPoll}
            />
          </Field>

          {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Tree depth" error={submitted ? errors.treeDepth : ""}>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                type="number"
                min={1}
                value={treeDepth}
                onChange={(e) => setTreeDepth(e.target.value)}
                className={inputClass(submitted && !!errors.treeDepth)}
                placeholder="2"
                // disabled={isDeployingPoll}
              />
            </Field>

            <Field label="Batch size" error={submitted ? errors.batchSize : ""}>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                type="number"
                min={1}
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className={inputClass(submitted && !!errors.batchSize)}
                placeholder="4"
                // disabled={isDeployingPoll}
              />
            </Field>

            <Field
              label="Initial voice credit"
              error={submitted ? errors.initVoiceCredit : ""}
            >
              <input
                inputMode="decimal"
                type="number"
                min={0}
                step="any"
                value={initVoiceCredit}
                onChange={(e) => setInitVoiceCredit(e.target.value)}
                className={inputClass(submitted && !!errors.initVoiceCredit)}
                placeholder="100"
                // disabled={isDeployingPoll}
              />
            </Field>
          </div> */}
        </section>

        {/* Additional fields removed — polls use anonymous option counts instead. */}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Number of options</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                value={numberOptions}
                onChange={(e) => setNumberOptions(Number(e.target.value))}
                className={inputClass(submitted && !!errors.options)}
                style={{ width: 120 }}
              />
            </div>
          </div>


          {submitted && errors.options ? (
            <p className="text-xs text-red-500">{errors.options}</p>
          ) : null}
        </section>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={(!isValid && submitted)  || !address}
            className="rounded-none border border-black bg-black px-4 py-2 text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Poll 
          </Button>
          {!isValid && submitted ? (
            <span className="text-sm text-red-500">Fix errors to continue</span>
          ) : null}
        </div>
      </form>
      {/* <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <div className="text-sm space-y-1">
          <p>Connected: {address ? "Yes" : " No"}</p>
          <p>Address: {address || "Not connected"}</p>
          <p>Deploying: {isDeployingPoll ? "Yes" : "No"}</p>
          <p>Success: {isDeploySuccess ? "Yes" : "No"}</p>
          <p>Next Poll ID: {nextPollId}</p>
          {deployError && (
            <p className="text-red-600">
              <strong>Error:</strong> {deployError.message}
            </p>
          )}
        </div>
      </div> */}
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}

function inputClass(invalid?: boolean) {
  const base =
    "w-full border px-3 py-2 outline-none rounded-none bg-white text-black placeholder-black/40";
  const ok = "border-black focus:ring-0";
  const bad = "border-red-500 focus:ring-0";
  return `${base} ${invalid ? bad : ok}`;
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
