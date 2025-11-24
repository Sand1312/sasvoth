"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { ideasApi, IdeaPayload, ipfsApi, pollsApi } from "@/api";
import {useMaci} from "@/hooks";
import {usePolls} from "@/hooks";
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
  const {deployPoll,getPollContracts} = useMaci();
  const {updatePollStatus,saveOnChainId} = usePolls();
  const [polls, setPolls] = useState<PollWithIdeas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipfsLinks, setIpfsLinks] = useState<Record<string, IdeaIpfsLink>>({});
  const [busyIdea, setBusyIdea] = useState<string | null>(null);
  const [busyPoll, setBusyPoll] = useState<string | null>(null);
  const preparePolls = useMemo(
    () => polls.filter((p) => (p.status || "").toLowerCase() === "prepare"),
    [polls]
  );

  useEffect(() => {
    refreshPolls();
  }, []);
  function toGatewayUrl(cid?: string) {
    if (!cid) return undefined;
    const normalized = cid.startsWith("ipfs://")
      ? cid.replace("ipfs://", "")
      : cid;
    return `/api/ipfs/${normalized}`;
  }
  async function handleDeployPoll(poll: PollRecord) {
    const pollId = poll._id || poll.id;
    if (!pollId) return;
    setBusyPoll(pollId);
    setError(null);
    try {
      const startDate = Math.floor(
        typeof poll.startTime === 'string'
          ? new Date(poll.startTime).getTime()
          : (poll.startTime?.getTime() ?? 0)
      ) / 1000;
      const endDate = Math.floor(
        typeof poll.endTime === 'string'
          ? new Date(poll.endTime).getTime()
          : (poll.endTime?.getTime() ?? 0)
      ) / 1000;

      // const startDate = Math.floor(Date.now() / 1000) + 60

      // const endDate = Math.floor(Date.now() / 1000) + 300
      // Deploy poll onchain
      const deployed = await deployPoll({ startDate, endDate, voteOptions: poll.numberOptions });
      // Nếu deploy thành công, tiếp tục update status và lưu onchainId
      if (deployed && deployed.pollId) {
        const status = PollStatus.InProgress;
        await updatePollStatus(pollId, status);
        await saveOnChainId(pollId, deployed.pollId);
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
    try {
      await pollsApi.approveIdeaInPoll(pollId, ideaId);
      const metadata = {
        pollId,
        ideaId,
        title: idea.title,
        description: idea.description,
        creator: idea.creatorIdea,
        approvedAt: new Date().toISOString(),
      };
      const { cid, cidUri, url } = await ipfsApi.uploadMetadata(metadata);
      const storedCid = cidUri || cid;
      setIpfsLinks((prev) => ({
        ...prev,
        [ideaId]: {
          cid: storedCid.startsWith("ipfs://")
            ? storedCid
            : `ipfs://${storedCid}`,
          url,
        },
      }));
      try {
        await ideasApi.updateIdeaCID(ideaId, cidUri || cid);
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
                      <b>Start:</b> {poll.startTime ? new Date(poll.startTime).toLocaleString() : "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      <b>End:</b> {poll.endTime ? new Date(poll.endTime).toLocaleString() : "-"}
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
                      {busyPoll === (poll._id || poll.id) ? "Deploying…" : "Deploy poll"}
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
    </main>
  );
}
