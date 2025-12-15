"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { ideasApi, IdeaPayload, ipfsApi, pollsApi } from "@/api";
import { useMaci } from "@/hooks";
import { usePolls } from "@/hooks";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { PollStatus } from "@/types/polls";

// Types coming from backend models
type PollRecord = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  ideas?: string[];
  ideaIds?: string[];
  options?: string[];
  approvedIdeaIds?: string[];
  startTime?: string | Date;
  endTime?: string | Date;
  numberOptions?: number;
  pollIdOnChain?: number | string;
};

type IdeaRecord = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  descriptionMore?: string[];
  imgSrc?: string;
  imgsSrc?: string[];
  creatorIdea?: string;
  idea_cid?: string;
};

type PollWithIdeas = PollRecord & { ideaMap: Record<string, IdeaRecord> };

type IdeaIpfsLink = {
  cid: string;
  url: string;
};

type IdeaFormState = {
  title: string;
  description: string;
  imgSrc: string;
  gallery: string;
  creatorIdea: string;
  extraNotes: string;
};

const defaultForm: IdeaFormState = {
  title: "",
  description: "",
  imgSrc: "",
  gallery: "",
  creatorIdea: "",
  extraNotes: "",
};

function normalizeIdeaId(idea: IdeaRecord | string | undefined) {
  if (!idea) return undefined;
  if (typeof idea === "string") return idea;
  return idea._id || idea.id;
}

export default function AdminPollsPage(): React.ReactElement {
  const {
    deployMaciContract,
    deployPoll,
    getPollContracts,
    mergePoll,
    generateProofs,
    submitProofs,
  } = useMaci();
  const { updatePollStatus, saveOnChainId, approveIdeaInPoll } = usePolls();
  const [polls, setPolls] = useState<PollWithIdeas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipfsLinks, setIpfsLinks] = useState<Record<string, IdeaIpfsLink>>({});
  const [busyIdea, setBusyIdea] = useState<string | null>(null);
  const [busyPoll, setBusyPoll] = useState<string | null>(null);

  // MACI State
  const [maciAddress, setMaciAddress] = useState<string | null>(null);
  const [maciStartBlock, setMaciStartBlock] = useState<number | null>(null);
  const [pollDurations, setPollDurations] = useState<Record<string, number>>(
    {}
  );

  const preparePolls = useMemo(
    () => polls.filter((p) => (p.status || "").toLowerCase() === "prepare"),
    [polls]
  );

  useEffect(() => {
    refreshPolls();
    const storedMaci = localStorage.getItem("maciAddress");
    const storedBlock = localStorage.getItem("maciStartBlock");
    if (storedMaci) setMaciAddress(storedMaci);
    if (storedBlock) setMaciStartBlock(Number(storedBlock));
  }, []);

  function toGatewayUrl(cid?: string) {
    if (!cid) return undefined;
    const normalized = cid.startsWith("ipfs://")
      ? cid.replace("ipfs://", "")
      : cid;
    return `/api/ipfs/${normalized}`;
  }

  async function handleDeployMaci() {
    setLoading(true);
    try {
      const payload = {
        chain: "arbitrum_sepolia",
        sessionKeyAddress: "0xDB750f2c4196d4989d97A137c8D3779e5B93E666", // Placeholder/Admin Key
        config: {
          policy: {
            policyType:
              "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy",
            checkerType:
              "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllChecker.sol:FreeForAllChecker",
          },
          MACI: {
            policy:
              "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy",
            stateTreeDepth: 10,
            modes: [1],
          },
          VerifyingKeysRegistry: {
            args: {
              stateTreeDepth: 10,
              intStateTreeDepth: 10,
              pollStateTreeDepth: 10,
              tallyProcessingStateTreeDepth: 1,
              voteOptionTreeDepth: 2,
              messageBatchSize: 20,
            },
          },
        },
      };

      const res = await deployMaciContract(payload);
      if (res && res.address) {
        setMaciAddress(res.address);
        localStorage.setItem("maciAddress", res.address);

        let block = res.blockNumber;
        if (!block) {
          // Fallback: Fetch current block from chain
          try {
            const publicClient = createPublicClient({
              chain: arbitrumSepolia,
              transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
            });
            block = Number(await publicClient.getBlockNumber());
          } catch (e) {
            console.warn("Failed to fetch current block number", e);
            block = 0;
          }
        }

        setMaciStartBlock(block);
        localStorage.setItem("maciStartBlock", block.toString());
      }
    } catch (err) {
      setError("Failed to deploy MACI contract.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeployPoll(poll: PollRecord) {
    const pollId = poll._id || poll.id;
    if (!pollId) return;
    if (!maciAddress) {
      setError("MACI Contract not deployed. Please deploy MACI first.");
      return;
    }

    setBusyPoll(pollId);
    setError(null);
    try {
      // Fetch current blockchain time to avoid local clock skew
      let now = Math.floor(Date.now() / 1000);
      try {
        const publicClient = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL),
        });
        const block = await publicClient.getBlock();
        now = Number(block.timestamp);
      } catch (err) {
        console.warn(
          "Failed to fetch blockchain timestamp, falling back to local time",
          err
        );
      }

      const durationMinutes = pollDurations[pollId] || 60;
      const durationSeconds = durationMinutes * 60;
      const startDate = now + 60; // Start in 1 min
      const endDate = now + 60 + durationSeconds;

      // Deploy poll onchain
      const deployed = await deployPoll({
        chain: "arbitrum_sepolia",
        maciAddress: maciAddress,
        sessionKeyAddress: "0xDB750f2c4196d4989d97A137c8D3779e5B93E666", // Placeholder
        config: {
          startDate,
          endDate,
          mode: 1,
          tallyProcessingStateTreeDepth: 1,
          messageBatchSize: 20,
          pollStateTreeDepth: 10,
          voteOptionTreeDepth: 2,
          policy: {
            policyType:
              "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy",
            checkerType:
              "@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllChecker.sol:FreeForAllChecker",
          },
          initialVoiceCreditsProxy: {
            factoryType: "ConstantInitialVoiceCreditProxyFactory",
            type: "ConstantInitialVoiceCreditProxy",
            args: { amount: "100" },
          },
          voteOptions: (poll.numberOptions || 4).toString(),
        },
      });
      // Nếu deploy thành công, tiếp tục update status và lưu onchainId
      if (deployed && deployed.pollId !== undefined) {
        console.log(
          `Poll deployed successfully! On-chain Poll ID: ${deployed.pollId}`
        );
        const status = PollStatus.InProgress;
        await updatePollStatus(pollId, status);
        await saveOnChainId(
          pollId,
          deployed.pollId.toString(),
          deployed.subgraphUrl
        );
        alert(`Poll deployed! On-chain ID: ${deployed.pollId}`);
      } else {
        console.error("Deploy response missing pollId:", deployed);
        setError("Poll deployed but no pollId returned. Check console.");
      }
    } catch (err) {
      setError("Unable to deploy poll.");
    } finally {
      setBusyPoll(null);
    }
  }
  async function refreshPolls() {
    setLoading(true);
    setError(null);
    try {
      const data: PollRecord[] = await pollsApi.getPolls();
      const hydrated: PollWithIdeas[] = await Promise.all(
        (data || []).map(async (poll) => {
          const ideaIds = [
            ...(poll.ideaIds ?? []),
            ...(poll.ideas ?? []),
            ...(poll.approvedIdeaIds ?? poll.options ?? []),
          ].filter((id): id is string => Boolean(id));
          const pairs = await Promise.all(
            ideaIds.map(async (ideaId) => {
              try {
                const idea = await ideasApi.getIdeaById(ideaId);
                return [ideaId, idea] as [string, IdeaRecord];
              } catch (err) {
                console.error("Failed to load idea", ideaId, err);
                return null;
              }
            })
          );
          const ideaMap = Object.fromEntries(
            pairs.filter(Boolean) as [string, IdeaRecord][]
          );
          return { ...poll, ideaMap };
        })
      );
      setPolls(hydrated);
    } catch (err) {
      console.error("Failed to load polls", err);
      setError("Unable to load polls. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveIdea(poll: PollRecord, idea: IdeaRecord) {
    const pollId = poll._id || "";
    const ideaId = normalizeIdeaId(idea);
    if (!pollId || !ideaId) return;
    setBusyIdea(ideaId);
    setError(null);

    // Helper to upload local URL to IPFS, or return existing CID/URL if not local
    const urlToCid = async (url?: string): Promise<string> => {
      if (!url) return "";
      // If it's already an IPFS URI or CID (simple check)
      if (url.startsWith("ipfs://") || !url.startsWith("/")) return url;

      try {
        console.log(`Fetching local file: ${url}`);
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], url.split("/").pop() || "image.png", {
          type: blob.type,
        });
        console.log(`Uploading to IPFS...`);
        const { cid } = await ipfsApi.uploadFile(file);
        console.log(`Uploaded ${url} -> ${cid}`);
        return cid;
      } catch (err) {
        console.error("Failed to convert local file to IPFS", url, err);
        return url; // Fallback? or throw?
      }
    };

    try {
      // await pollsApi.approveIdeaInPoll(pollId, ideaId);

      let layoutItems = [];
      try {
        if (idea.descriptionMore?.[1]) {
          layoutItems = JSON.parse(idea.descriptionMore[1]);
        }
      } catch (e) {
        console.warn("Failed to parse layout items", e);
      }

      // Convert Images to IPFS
      const logoCid = await urlToCid(idea.imgSrc);
      const heroCid = await urlToCid(idea.imgsSrc?.[0]);

      const metadata = {
        pollId,
        ideaId,
        title: idea.title,
        description: idea.description,
        logo: logoCid,
        heroImage: heroCid,
        ageLimit: idea.descriptionMore?.[0], // Age Limit from DB
        layoutItems: layoutItems,
        creator: idea.creatorIdea,
        approvedAt: new Date().toISOString(),
      };

      const { cid, url } = await ipfsApi.uploadMetadata(metadata);
      const storedCid = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`;
      setIpfsLinks((prev) => ({
        ...prev,
        [ideaId]: {
          cid: storedCid,
          url,
        },
      }));
      try {
        // Also update the Idea in DB to point to the new Metadata or at least update CIDs?
        // Ideally we should update the Idea's imgSrc to the new CID too, to "finalize" it.
        // But for now, we just link the metadata.
        await approveIdeaInPoll(pollId, ideaId, cid);

        // OPTIONAL: Update idea record with new CIDs to stop using local files?
        // await ideasApi.updateIdea(ideaId, { imgSrc: logoCid, imgsSrc: [heroCid] });
      } catch (err) {
        console.warn("Unable to persist idea CID", err);
      }
      await refreshPolls();
    } catch (err) {
      console.error("Approve idea failed", err);
      setError("Unable to approve idea right now.");
    } finally {
      setBusyIdea(null);
    }
  }
  async function handlePublishApproved(poll: PollWithIdeas) {
    const pollId = poll._id || "";
    if (!pollId) return;
    const approvedIds = poll.options ?? [];
    if (approvedIds.length === 0) {
      setError("No approved ideas to publish.");
      return;
    }

    setBusyPoll(pollId);
    setError(null);
    try {
      await Promise.all(
        approvedIds.map(async (ideaId) => {
          const idea = poll.ideaMap[ideaId];
          if (!idea) return;
          const metadata = {
            pollId,
            ideaId,
            title: idea.title,
            description: idea.description,
            creator: idea.creatorIdea,
            approvedAt: new Date().toISOString(),
          };
          const { cid, url } = await ipfsApi.uploadMetadata(metadata);
          setIpfsLinks((prev) => ({
            ...prev,
            [ideaId]: {
              cid: cid,
              url,
            },
          }));
          try {
            await ideasApi.updateIdeaCID(ideaId, cid);
          } catch (err) {
            console.warn("Unable to persist idea CID", err);
          }
        })
      );
      await refreshPolls();
    } catch (err) {
      console.error("Publish approved ideas failed", err);
      setError("Unable to publish approved ideas to IPFS.");
    } finally {
      setBusyPoll(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Admin
          </p>
          <h1 className="text-3xl font-semibold">Poll preparation</h1>
          <p className="text-sm text-slate-600">
            Review polls in the preparation stage, approve ideas, and publish
            the resulting metadata to IPFS.
          </p>
        </div>
        <Button variant="outline" onClick={refreshPolls} disabled={loading}>
          Refresh list
        </Button>
      </header>

      {/* MACI Deployment Logic */}
      <section className="mb-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">MACI Configuration</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">
              Target Chain:{" "}
              <span className="font-mono font-bold">Arbitrum Sepolia</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              MACI Address:{" "}
              {maciAddress ? (
                <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {maciAddress}
                </span>
              ) : (
                <span className="text-red-500 font-bold">Not Deployed</span>
              )}
            </p>
            {maciStartBlock && (
              <p className="text-sm text-slate-600 mt-1">
                Start Block: <span className="font-mono">{maciStartBlock}</span>
              </p>
            )}
          </div>
          {!maciAddress && (
            <Button onClick={handleDeployMaci} disabled={loading}>
              {loading ? "Deploying..." : "Deploy MACI Contract"}
            </Button>
          )}
          {maciAddress && (
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("maciAddress");
                localStorage.removeItem("maciStartBlock");
                setMaciAddress(null);
                setMaciStartBlock(null);
              }}
            >
              Reset / Redeploy
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-600">Loading polls…</p>}

      {!loading && preparePolls.length === 0 && (
        <p className="text-sm text-slate-600">
          No polls are currently in the “prepare” state.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {preparePolls.map((poll) => {
          const ideaIds = poll.ideaIds ?? poll.ideas ?? [];
          const approved = poll.approvedIdeaIds ?? poll.options ?? [];
          return (
            <section
              key={poll._id ?? poll.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    {poll.title || "Untitled poll"}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {poll.description || "No description"}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs text-slate-500">
                      <b>Start:</b>{" "}
                      {poll.startTime
                        ? new Date(poll.startTime).toLocaleString()
                        : "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      <b>End:</b>{" "}
                      {poll.endTime
                        ? new Date(poll.endTime).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-amber-600">
                    Status: {poll.status}
                  </p>
                </div>
                <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pending ideas: {ideaIds.length}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-700">
                    Pending approval
                  </h3>
                  {ideaIds.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No uploaded ideas yet.
                    </p>
                  )}
                  {ideaIds.map((ideaId) => {
                    const idea = poll.ideaMap[ideaId];
                    return (
                      <div
                        key={ideaId}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {idea?.title || "Untitled idea"}
                          </p>
                          <p className="text-xs text-slate-600">
                            {idea?.description || "No description provided."}
                          </p>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                            ID: {ideaId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                          {ipfsLinks[ideaId]?.url && (
                            <a
                              href={ipfsLinks[ideaId].url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-700 underline"
                            >
                              View metadata
                            </a>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!idea) return;
                              handleApproveIdea(poll, idea);
                            }}
                            disabled={busyIdea === ideaId}
                          >
                            {busyIdea === ideaId
                              ? "Approving…"
                              : "Approve idea"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-700">
                    Approved options
                  </h3>
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      POLL DURATION (MINUTES)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="border border-slate-300 rounded px-3 py-1 text-sm w-full max-w-[200px]"
                      value={pollDurations[poll._id || poll.id || ""] || 60}
                      onChange={(e) => {
                        const pid = poll._id || poll.id;
                        if (pid) {
                          setPollDurations((prev) => ({
                            ...prev,
                            [pid]: Number(e.target.value),
                          }));
                        }
                      }}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Default: 60 minutes
                    </p>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePublishApproved(poll)}
                      disabled={busyPoll === poll._id || approved.length === 0}
                    >
                      {busyPoll === poll._id
                        ? "Publishing…"
                        : "Publish all to IPFS"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeployPoll(poll)}
                      disabled={busyPoll === (poll._id || poll.id)}
                    >
                      {busyPoll === (poll._id || poll.id)
                        ? "Deploying…"
                        : "Deploy poll"}
                    </Button>
                  </div>
                  {approved.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No approved options yet.
                    </p>
                  )}
                  {approved.map((ideaId) => {
                    const idea = poll.ideaMap[ideaId];
                    const cid = idea?.idea_cid || ipfsLinks[ideaId]?.cid;
                    const href = toGatewayUrl(cid) || ipfsLinks[ideaId]?.url;
                    return (
                      <div
                        key={`${ideaId}-approved`}
                        className="flex flex-col gap-1 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900"
                      >
                        <div className="font-semibold">
                          {idea?.title || ideaId}
                        </div>
                        <div className="text-xs text-emerald-800">
                          {idea?.description || "Approved idea"}
                        </div>
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold uppercase tracking-[0.2em] underline"
                          >
                            {cid || href}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Active & Ended Polls
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {polls
          .filter((p) =>
            ["inprogress", "ended"].includes((p.status || "").toLowerCase())
          )
          .map((poll) => (
            <section
              key={poll._id || poll.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{poll.title}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Poll ID: {poll.id}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${poll.status === "InProgress" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                    >
                      {poll.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Tallying Operations
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      mergePoll(
                        poll.pollIdOnChain?.toString() || poll.id || "1",
                        maciAddress || undefined
                      )
                    }
                  >
                    Merge Signups/Logs
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      let startBlock = 0;
                      try {
                        if (localStorage.getItem("maciStartBlock")) {
                          startBlock = Number(
                            localStorage.getItem("maciStartBlock")
                          );
                        }
                      } catch (e) {}
                      generateProofs(
                        poll.pollIdOnChain?.toString() || poll.id || "1",
                        maciAddress || undefined,
                        startBlock
                      );
                    }}
                  >
                    Generate Proofs
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      submitProofs(
                        poll.pollIdOnChain?.toString() || poll.id || "1",
                        maciAddress || undefined
                      )
                    }
                  >
                    Submit Proofs
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  * Use the buttons above to trigger MACI tallying steps.
                </p>
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
