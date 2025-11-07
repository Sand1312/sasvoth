"use client";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@sasvoth/ui/button";
import { useAccount } from "wagmi";
import { useMACI } from "../../hooks/useMaci";
import { usePolls } from "../../hooks/usePolls";

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
  const { createPoll, isDeployingPoll, isDeploySuccess, nextPollId, deployError } = useMACI();
  const { initPoll } = usePolls();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [treeDepth, setTreeDepth] = useState<string>("");
  const [batchSize, setBatchSize] = useState<string>("");
  const [initVoiceCredit, setInitVoiceCredit] = useState<string>("");
  const [options, setOptions] = useState<VoteOption[]>([
    { id: cryptoRandomId(), label: "" },
    { id: cryptoRandomId(), label: "" },
  ]);
  const [submitted, setSubmitted] = useState(false);

  // Xử lý sau khi deploy thành công
  useEffect(() => {
    if (isDeploySuccess && nextPollId > 0) {
      console.log(" Poll deployed successfully! Poll ID:", nextPollId);
      // Có thể gọi API lưu vào DB ở đây
      // initPoll(options.map(o => o.label), new Date(startTime), new Date(endTime));
    }
  }, [isDeploySuccess, nextPollId]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (!startTime) e.startTime = "Start time is required";
    if (!endTime) e.endTime = "End time is required";
    if (start && end && end <= start) e.endTime = "End must be after start";

    const td = Number(treeDepth);
    if (!treeDepth) e.treeDepth = "Tree depth is required";
    else if (!Number.isInteger(td) || td < 1)
      e.treeDepth = "Tree depth must be a positive integer";

    const bs = Number(batchSize);
    if (!batchSize) e.batchSize = "Batch size is required";
    else if (!Number.isInteger(bs) || bs < 1)
      e.batchSize = "Batch size must be a positive integer";

    const vc = Number(initVoiceCredit);
    if (initVoiceCredit === "")
      e.initVoiceCredit = "Initial voice credit is required";
    else if (!isFinite(vc) || vc < 0)
      e.initVoiceCredit = "Initial voice credit must be ≥ 0";

    const trimmed = options.map((o) => o.label.trim());
    if (trimmed.length < 2) e.options = "At least two options are required";
    else if (trimmed.some((t) => t.length === 0))
      e.options = "Options cannot be empty";
    else if (
      new Set(trimmed.map((t) => t.toLowerCase())).size !== trimmed.length
    )
      e.options = "Options must be unique";

    return e;
  }, [startTime, endTime, treeDepth, batchSize, initVoiceCredit, options]);

  const isValid = Object.keys(errors).length === 0;

  function addOption() {
    setOptions((prev) => [...prev, { id: cryptoRandomId(), label: "" }]);
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  function updateOption(id: string, label: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    
    if (!isValid) {
      console.log("❌ Form validation failed:", errors);
      return;
    }
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log('🚀 Starting poll creation...');

      // Tính UNIX timestamp (giây)
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      console.log('⏰ Timestamps:', { startTimestamp, endTimestamp });

      // Tạo poll parameters theo đúng ABI
      const treeDepths = {
        intStateTreeDepth: Number(treeDepth) || 2,
        messageTreeDepth: 4, // stateTreeDepth
        voteOptionTreeDepth: 3,
      };

      // GỌI createPoll VỚI ĐÚNG THAM SỐ MỚI
      createPoll(
        startTimestamp,
        endTimestamp,
        treeDepths,
        address, // coordinator address
        Number(batchSize),
        options.length // số lượng options
      );

      console.log('createPoll called, waiting for MetaMask...');

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

      {/* Error Message */}
      {deployError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
             Error: {deployError.message}
          </p>
        </div>
      )}

      {/* Success Message */}
      {isDeploySuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Poll created successfully! Poll ID: {nextPollId}
          </p>
          <p className="text-green-700 text-sm mt-1">
            The poll has been deployed to the blockchain.
          </p>
        </div>
      )}

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
          <Field label="Start time" error={submitted ? errors.startTime : ""}>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass(submitted && !!errors.startTime)}
              disabled={isDeployingPoll}
            />
          </Field>

          <Field label="End time" error={submitted ? errors.endTime : ""}>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass(submitted && !!errors.endTime)}
              disabled={isDeployingPoll}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                disabled={isDeployingPoll}
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
                disabled={isDeployingPoll}
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
                disabled={isDeployingPoll}
              />
            </Field>
          </div>
        </section>

        {/* Dynamic additional fields (self-contained component) */}
        {(() => {
          function DynamicFields() {
            const [fields, setFields] = useState<
              {
                id: string;
                label: string;
                type: "text" | "number" | "datetime";
                value: string;
              }[]
            >([]);

            function addField() {
              setFields((s) => [
                ...s,
                {
                  id: cryptoRandomId(),
                  label: `Field ${s.length + 1}`,
                  type: "text",
                  value: "",
                },
              ]);
            }

            function removeField(id: string) {
              setFields((s) => s.filter((f) => f.id !== id));
            }

            function updateField(
              id: string,
              patch: Partial<{ label: string; type: any; value: string }>
            ) {
              setFields((s) =>
                s.map((f) => (f.id === id ? { ...f, ...patch } : f))
              );
            }

            return (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Additional fields
                  </label>
                  <Button
                    type="button"
                    onClick={addField}
                    disabled={isDeployingPoll}
                    className="inline-flex items-center gap-2 rounded-none border border-black bg-white px-3 py-1 text-sm text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon />
                    Add field
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.length === 0 ? (
                    <p className="text-sm text-black/70">
                      No additional fields yet.
                    </p>
                  ) : null}

                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-4"
                    >
                      <input
                        value={f.label}
                        onChange={(e) =>
                          updateField(f.id, { label: e.target.value })
                        }
                        placeholder="Label"
                        className={inputClass()}
                        disabled={isDeployingPoll}
                      />

                      <select
                        value={f.type}
                        onChange={(e) =>
                          updateField(f.id, {
                            type: e.target.value as
                              | "text"
                              | "number"
                              | "datetime",
                          })
                        }
                        className={inputClass()}
                        disabled={isDeployingPoll}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="datetime">Date / Time</option>
                      </select>

                      <input
                        type={
                          f.type === "datetime"
                            ? "datetime-local"
                            : f.type === "number"
                              ? "number"
                              : "text"
                        }
                        inputMode={f.type === "number" ? "numeric" : "text"}
                        value={f.value}
                        onChange={(e) =>
                          updateField(f.id, { value: e.target.value })
                        }
                        placeholder="Value"
                        className={inputClass()}
                        disabled={isDeployingPoll}
                      />

                      <button
                        type="button"
                        onClick={() => removeField(f.id)}
                        className="inline-flex h-9 items-center justify-center border border-black text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Remove field"
                        disabled={isDeployingPoll}
                      >
                        <XIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return <DynamicFields />;
        })()}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Vote options</label>
            <Button
              type="button"
              onClick={addOption}
              disabled={isDeployingPoll}
              className="inline-flex items-center gap-2 rounded-none border border-black bg-white px-3 py-1 text-sm text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon />
              Add option
            </Button>
          </div>

          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className={inputClass(submitted && !!errors.options)}
                  disabled={isDeployingPoll}
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="inline-flex h-9 w-9 items-center justify-center border border-black text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove option"
                  disabled={options.length <= 1 || isDeployingPoll}
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
          {submitted && errors.options ? (
            <p className="text-xs text-red-500">{errors.options}</p>
          ) : null}
        </section>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={(!isValid && submitted) || isDeployingPoll || !address}
            className="rounded-none border border-black bg-black px-4 py-2 text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeployingPoll ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Poll...
              </div>
            ) : (
              'Create vote on Blockchain'
            )}
          </Button>
          {!isValid && submitted ? (
            <span className="text-sm text-red-500">Fix errors to continue</span>
          ) : null}
        </div>
      </form>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <div className="text-sm space-y-1">
          <p>Connected: {address ? 'Yes' : ' No'}</p>
          <p>Address: {address || 'Not connected'}</p>
          <p>Deploying: {isDeployingPoll ? 'Yes' : 'No'}</p>
          <p>Success: {isDeploySuccess ? 'Yes' : 'No'}</p>
          <p>Next Poll ID: {nextPollId}</p>
          {deployError && (
            <p className="text-red-600">
              <strong>Error:</strong> {deployError.message}
            </p>
          )}
        </div>
      </div>
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