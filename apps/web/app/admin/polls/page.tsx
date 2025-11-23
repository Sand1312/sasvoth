"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { ideasApi, IdeaPayload, ipfsApi, pollsApi } from "@/api";

// Types coming from backend models
type PollRecord = {
  _id?: string;
  title?: string;
  description?: string;
  status?: string;
  ideas?: string[];
  options?: string[];
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
  const [polls, setPolls] = useState<PollWithIdeas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, IdeaFormState>>({});
  const [ipfsLinks, setIpfsLinks] = useState<Record<string, string>>({});
  const [busyIdea, setBusyIdea] = useState<string | null>(null);

  const preparePolls = useMemo(
    () => polls.filter((p) => (p.status || "").toLowerCase() === "prepare"),
    [polls]
  );

  useEffect(() => {
    refreshPolls();
  }, []);

  function updateForm(pollId: string, patch: Partial<IdeaFormState>) {
    setFormState((prev) => ({
      ...prev,
      [pollId]: {
        ...defaultForm,
        ...(prev[pollId] ?? {}),
        ...patch,
      },
    }));
  }

  function getForm(pollId: string): IdeaFormState {
    return formState[pollId] ?? defaultForm;
  }

  async function refreshPolls() {
    setLoading(true);
    setError(null);
    try {
      const data: PollRecord[] = await pollsApi.getPolls("prepare");
      const hydrated: PollWithIdeas[] = await Promise.all(
        (data || []).map(async (poll) => {
          const ideaIds = [...(poll.ideas ?? []), ...(poll.options ?? [])];
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

  async function handleIdeaSubmit(poll: PollRecord) {
    const pollId = poll._id || "";
    if (!pollId) return;
    const form = getForm(pollId);
    if (!form.title || !form.description || !form.imgSrc) {
      setError("Please fill the title, description, and image fields before uploading.");
      return;
    }
    setBusyIdea(pollId);
    setError(null);
    try {
      const payload: IdeaPayload = {
        title: form.title,
        description: form.description,
        descriptionMore: form.extraNotes ? [form.extraNotes] : [],
        imgSrc: form.imgSrc,
        imgsSrc: form.gallery
          ? form.gallery
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : [form.imgSrc],
        creatorIdea: form.creatorIdea || "admin",
      };
      const createdIdea = await ideasApi.createIdea(payload);
      const ideaId = normalizeIdeaId(createdIdea);
      if (!ideaId) {
        throw new Error("Idea could not be created (missing id)");
      }
      await pollsApi.addIdeaToPoll(pollId, ideaId);
      updateForm(pollId, defaultForm);
      await refreshPolls();
    } catch (err) {
      console.error("Idea upload failed", err);
      setError("Failed to upload idea. Please try again.");
    } finally {
      setBusyIdea(null);
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
      const { cid, url } = await ipfsApi.uploadMetadata(metadata);
      setIpfsLinks((prev) => ({ ...prev, [ideaId]: url }));
      try {
        await ideasApi.updateIdeaCID(ideaId, cid);
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

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Poll preparation</h1>
          <p className="text-sm text-slate-600">
            Upload ideas to polls in the preparation stage, approve them, and publish the
            resulting metadata to IPFS.
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
          const ideaIds = poll.ideas ?? [];
          const approved = poll.options ?? [];
          return (
            <section key={poll._id ?? poll.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{poll.title || "Untitled poll"}</h2>
                  <p className="text-sm text-slate-600">{poll.description || "No description"}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-amber-600">
                    Status: {poll.status}
                  </p>
                </div>
                <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pending ideas: {ideaIds.length}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-700">
                      Upload idea
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => handleIdeaSubmit(poll)}
                      disabled={busyIdea === (poll._id || "")}
                    >
                      {busyIdea === (poll._id || "") ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Title
                      <Input
                        value={getForm(poll._id || "").title}
                        onChange={(e) =>
                          updateForm(poll._id || "", { title: e.target.value })
                        }
                        placeholder="Idea headline"
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Lead image URL
                      <Input
                        value={getForm(poll._id || "").imgSrc}
                        onChange={(e) =>
                          updateForm(poll._id || "", { imgSrc: e.target.value })
                        }
                        placeholder="https://…"
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                      Description
                      <textarea
                        value={getForm(poll._id || "").description}
                        onChange={(e) =>
                          updateForm(poll._id || "", { description: e.target.value })
                        }
                        placeholder="What makes this idea worth backing?"
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:border-slate-400 focus:outline-none"
                        rows={3}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Gallery (comma separated URLs)
                      <Input
                        value={getForm(poll._id || "").gallery}
                        onChange={(e) =>
                          updateForm(poll._id || "", { gallery: e.target.value })
                        }
                        placeholder="https://…, https://…"
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Creator handle
                      <Input
                        value={getForm(poll._id || "").creatorIdea}
                        onChange={(e) =>
                          updateForm(poll._id || "", { creatorIdea: e.target.value })
                        }
                        placeholder="@admin"
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600 md:col-span-2">
                      Extra notes
                      <textarea
                        value={getForm(poll._id || "").extraNotes}
                        onChange={(e) =>
                          updateForm(poll._id || "", { extraNotes: e.target.value })
                        }
                        placeholder="Optional copy that will be added to metadata"
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm focus:border-slate-400 focus:outline-none"
                        rows={2}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-700">
                    Pending approval
                  </h3>
                  {ideaIds.length === 0 && (
                    <p className="text-sm text-slate-500">No uploaded ideas yet.</p>
                  )}
                  {ideaIds.map((ideaId) => {
                    const idea = poll.ideaMap[ideaId];
                    return (
                      <div
                        key={ideaId}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{idea?.title || "Untitled idea"}</p>
                          <p className="text-xs text-slate-600">
                            {idea?.description || "No description provided."}
                          </p>
                          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                            ID: {ideaId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                          {ipfsLinks[ideaId] && (
                            <a
                              href={ipfsLinks[ideaId]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-700 underline"
                            >
                              View metadata
                            </a>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleApproveIdea(poll, idea)}
                            disabled={busyIdea === ideaId}
                          >
                            {busyIdea === ideaId ? "Approving…" : "Approve idea"}
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
                  {approved.length === 0 && (
                    <p className="text-sm text-slate-500">No approved options yet.</p>
                  )}
                  {approved.map((ideaId) => {
                    const idea = poll.ideaMap[ideaId];
                    const cid = idea?.idea_cid || ipfsLinks[ideaId];
                    return (
                      <div
                        key={`${ideaId}-approved`}
                        className="flex flex-col gap-1 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900"
                      >
                        <div className="font-semibold">{idea?.title || ideaId}</div>
                        <div className="text-xs text-emerald-800">
                          {idea?.description || "Approved idea"}
                        </div>
                        {cid && (
                          <a
                            href={cid.startsWith("http") ? cid : cid}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold uppercase tracking-[0.2em] underline"
                          >
                            {cid}
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
