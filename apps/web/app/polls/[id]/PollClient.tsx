"use client";
import { useEffect, useState } from "react";
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { Button } from "@sasvoth/ui/button";
import { IdeaSubmitFormTrigger } from "@/components/idea-submit-form-trigger";
import { PollStatus } from "@/types/polls";
import { usePolls, useIdeas } from "@/hooks";
import { ideasApi, ipfsApi } from "@/api";
import { formatDate } from "@/lib/date";
import Link from "next/link";
import { usePollContext } from "./PollContext";
import { useIPFS } from "@/hooks/useIPFS";
import { useResults, useJoinPoll, useMaci } from "@/hooks";

type Timeline = { start: string; end: string };

type Idea = {
  _id: string;
  title: string;
  summary: string;
  credits: number;
  votes: number;
  creator: string;
};

type VoteOption = {
  id: string;
  label: string;
  description: string;
  weight: number;
};

type TallyResult = {
  id: string;
  label: string;
  votes: number;
  percentage: number;
  author: string;
};

type ApiIdea = {
  _id?: string;
  title?: string;
  description?: string;
  descriptionMore?: string;
  creatorIdea?: string;
  creatorAddress?: string;
  idea_cid?: string;
};

type ApiPoll = {
  _id?: string;
  pollIdOnChain?: number | string;
  title?: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  timeframe?: Timeline;
  credits?: PollData["credits"];
  status?: PollStatus;
  ideas?: Idea[];
  ideaIds?: string[];
  approvedIdeaIds?: string[]; // Add this field
  options?: string[];
  results?: TallyResult[];
};

type PollData = {
  id: string;
  onChainId: string;
  title: string;
  description: string;
  timeframe: Timeline;
  credits: { spent: number; total: number; remaining?: number };
  status: PollStatus;
  ideas: Idea[];
  approvedIdeasId?: string[];
  approvedIdeas: Idea[]; // New field for hydrated approved ideas
  options: string[];
  results: TallyResult[];
};

const fallbackPoll: PollData = {
  id: "fallback-id",
  onChainId: "0",
  title: "Future of Play (Offline Data)",
  description:
    "A curated shortlist of ideas exploring how social games, creative tools, and fan communities will evolve next year.",
  timeframe: { start: "12 Oct 2024", end: "24 Nov 2024" },
  credits: { spent: 36, total: 120, remaining: 84 },
  status: PollStatus.InProgress,
  ideas: [],
  approvedIdeasId: [],
  approvedIdeas: [],
  options: [],
  results: [],
};

const normalizeIdea = (idea: ApiIdea, fallbackId: string): Idea => {
  // Use _id first, then idea_cid, then fallback - check for truthy values (not empty strings)
  const resolvedId =
    idea._id && idea._id.length > 0
      ? idea._id
      : idea.idea_cid && idea.idea_cid.length > 0
        ? idea.idea_cid
        : fallbackId;

  console.log(
    "normalizeIdea - resolved _id:",
    resolvedId,
    "from idea:",
    idea._id,
    "cid:",
    idea.idea_cid
  );

  return {
    _id: resolvedId,
    title: idea.title ?? "Untitled idea",
    summary: idea.description ?? idea.descriptionMore ?? "",
    credits: 0,
    votes: 0,
    creator: idea.creatorIdea ?? idea.creatorAddress ?? "",
  };
};

const fetchAndNormalizeIdeas = async (
  ideasOrIds: (string | ApiIdea)[] | undefined
): Promise<Idea[]> => {
  if (!ideasOrIds || ideasOrIds.length === 0) return [];

  // Case 1: Array of ID strings
  if (typeof ideasOrIds[0] === "string") {
    const ids = ideasOrIds as string[];
    console.log("fetchIdeas - fetching by IDs...", ids);
    const fetched = await Promise.all(
      ids.map(async (id) => {
        try {
          // Check if ID is likely a CID (starts with Qm or baf, typically)
          // or if it's NOT a standard MongoDB ObjectID (24 hex chars)
          const isCid =
            id.length > 24 || id.startsWith("Qm") || id.startsWith("baf");

          if (isCid) {
            const metadata = await ipfsApi.getById(id);
            // Normalize IPFS data. Inject _id as the CID.
            // We need to cast metadata to ApiIdea or manually normalize
            return normalizeIdea(metadata as ApiIdea, id);
          } else {
            const response = (await ideasApi.getIdeaById(id)) as ApiIdea;
            return normalizeIdea(response, id);
          }
        } catch (err) {
          console.error(`Failed to fetch idea ${id}:`, err);
          return null;
        }
      })
    );
    return fetched.filter((i): i is Idea => i !== null);
  }

  // Case 2: Array of Idea Objects
  console.log("fetchIdeas - normalizing objects...");
  return (ideasOrIds as ApiIdea[]).map((idea) =>
    normalizeIdea(idea, idea._id || "")
  );
};

export default function PollClient({
  searchParams,
}: {
  searchParams?: { phase?: string };
}) {
  const { pollId } = usePollContext();
  const { getPollById } = usePolls();

  const requestedPhase = searchParams?.phase?.toLowerCase() as
    | PollStatus
    | undefined;

  const isPhase = (value: string | undefined): value is PollStatus =>
    value === PollStatus.Prepare ||
    value === PollStatus.InProgress ||
    value === PollStatus.Ended ||
    value === PollStatus.Cancelled ||
    value === PollStatus.Counting;

  const [poll, setPoll] = useState<PollData>(() => fallbackPoll);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        console.log("Loading poll data for ID:", pollId);
        const response = await getPollById(pollId);
        console.log("Fetched poll data:", response);
        const source = (response ?? {}) as ApiPoll;

        // Fetch Pending Ideas (source.ideas or source.ideaIds)
        const pendingSource =
          source.ideas && source.ideas.length > 0
            ? source.ideas
            : source.ideaIds;
        const ideas = await fetchAndNormalizeIdeas(pendingSource as any[]);

        // Fetch Approved Ideas (source.options or source.approvedIdeaIds)
        // Note: 'options' usually holds the IDs of approved ideas in IPFS or DB
        const approvedSource =
          source.options && source.options.length > 0
            ? source.options
            : source.approvedIdeaIds;
        const approvedIdeas = await fetchAndNormalizeIdeas(
          approvedSource as string[]
        );
        const timeframeStart =
          (typeof source.startTime === "string"
            ? source.startTime
            : source.startTime?.toString()) ?? source.timeframe?.start;
        const timeframeEnd =
          (typeof source.endTime === "string"
            ? source.endTime
            : source.endTime?.toString()) ?? source.timeframe?.end;

        const now = new Date();
        const start = timeframeStart ? new Date(timeframeStart) : new Date();
        const end = timeframeEnd ? new Date(timeframeEnd) : new Date();

        // Ensure valid dates
        const isValidDate = (d: Date) => !isNaN(d.getTime());
        const startDate = isValidDate(start) ? start : new Date();
        const endDate = isValidDate(end) ? end : new Date();

        const isDeployed =
          source.pollIdOnChain !== undefined && source.pollIdOnChain !== null;

        let derivedStatus = source.status ?? fallbackPoll.status;

        if (isDeployed) {
          if (now < startDate) {
            derivedStatus = PollStatus.Prepare; // Waiting for start
          } else if (now >= startDate && now <= endDate) {
            derivedStatus = PollStatus.InProgress;
          } else {
            derivedStatus = PollStatus.Ended;
          }
        } else {
          // Not deployed
          if (now > startDate) {
            derivedStatus = PollStatus.Cancelled;
          } else {
            derivedStatus = PollStatus.Prepare;
          }
        }

        const mapped: PollData = {
          id: source._id ?? fallbackPoll.id,
          onChainId: source.pollIdOnChain?.toString() ?? fallbackPoll.onChainId,
          title: source.title ?? fallbackPoll.title,
          description: source.description ?? fallbackPoll.description,
          timeframe: {
            start: timeframeStart
              ? new Date(timeframeStart).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : fallbackPoll.timeframe.start,
            end: timeframeEnd
              ? new Date(timeframeEnd).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : fallbackPoll.timeframe.end,
          },
          credits: source.credits ?? fallbackPoll.credits,
          status: derivedStatus,
          ideas,
          approvedIdeas,
          options: source.options ?? fallbackPoll.options,
          results: source.results ?? fallbackPoll.results,
        };

        if (mounted) {
          setPoll(mapped);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch poll, using fallback data:", err);
        if (mounted) {
          setPoll(fallbackPoll);
          setError("Unable to reach the polls service. Showing offline data.");
        }
      } finally {
        // nothing to clean up
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [pollId]);

  const activeStatus = isPhase(requestedPhase) ? requestedPhase : poll.status;

  const pollWithStatus: PollData = { ...poll, status: activeStatus };
  const StatusComponent = (() => {
    switch (activeStatus) {
      case PollStatus.Prepare:
        return PrepareSection;
      case PollStatus.InProgress:
        return VotingSection;
      case PollStatus.Cancelled:
        // Use PrepareSection for Cancelled for now, or create a simple message?
        // User didn't specify UI for Cancelled, assume similar to Prepare but read-only?
        // Reuse PrepareSection but maybe we can disable submission in it?
        return PrepareSection;
      case PollStatus.Ended:
      default:
        return EndedSection;
    }
  })();

  // Dev: Tally state
  const [devTallying, setDevTallying] = useState(false);
  const [devTallyStatus, setDevTallyStatus] = useState("");
  const { mergePoll, generateProofs, submitProofs } = useMaci();

  const handleDevTally = async () => {
    if (
      poll.onChainId === undefined ||
      poll.onChainId === null ||
      poll.onChainId === ""
    ) {
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
    const maciAddress =
      typeof window !== "undefined"
        ? localStorage.getItem("maciAddress") || undefined
        : undefined;
    const startBlock =
      typeof window !== "undefined"
        ? Number(localStorage.getItem("maciStartBlock") || "0")
        : 0;

    if (!maciAddress) {
      if (
        !confirm(
          "MACI Address not found in localStorage. Continue with server default?"
        )
      ) {
        return;
      }
    }

    setDevTallying(true);
    try {
      setDevTallyStatus("Merging Poll...");
      await mergePoll(poll.onChainId, maciAddress);

      setDevTallyStatus("Generating Proofs (this takes time)...");
      await generateProofs(poll.onChainId, maciAddress, startBlock);

      setDevTallyStatus("Submitting Proofs...");
      await submitProofs(poll.onChainId, maciAddress);

      setDevTallyStatus("Done!");
      alert("Tally completed! Refreshing...");
      window.location.reload();
    } catch (e: any) {
      console.error("Tally failed:", e);
      alert("Tally failed: " + e.message);
      setDevTallyStatus("Failed.");
    } finally {
      setDevTallying(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        {/* Dev Container */}
        <div className="bg-yellow-50 p-4 rounded-lg text-sm border border-yellow-200">
          <div className="font-semibold text-yellow-800 mb-2">
            Dev: Poll Debug
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span>MACI:</span>
              <span className="font-mono text-xs bg-white px-2 py-1 rounded border truncate max-w-[200px]">
                {typeof window !== "undefined"
                  ? localStorage.getItem("maciAddress") || "Not set"
                  : "..."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Poll ID (On-Chain):</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">
                {poll.onChainId !== undefined &&
                poll.onChainId !== null &&
                poll.onChainId !== ""
                  ? poll.onChainId
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">
                {activeStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Results:</span>
              <span className="font-mono bg-white px-2 py-1 rounded border">
                {poll.results.length} items
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
                  poll.onChainId === undefined ||
                  poll.onChainId === null ||
                  poll.onChainId === ""
                }
                className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {devTallying ? "Tallying..." : "Tally Results (Dev)"}
              </button>
            </div>
          </div>
        </div>

        <PollHero
          poll={pollWithStatus}
          pollId={pollId}
          badge={
            activeStatus === PollStatus.Prepare
              ? poll.onChainId
                ? "Waiting for Start"
                : "Ideas in review"
              : activeStatus === PollStatus.InProgress
                ? "Opening"
                : activeStatus === PollStatus.Cancelled
                  ? "Cancelled"
                  : "Ended"
          }
        />
        {error && <p className="text-sm text-orange-600">{error}</p>}
        <StatusComponent poll={pollWithStatus} />
      </section>
    </main>
  );
}

function PollHero({
  poll,
  pollId,
  badge,
}: {
  poll: PollData;
  pollId: string;
  badge: string;
}) {
  return (
    <section className="rounded-[40px] border border-black px-8 py-10 shadow-[0_10px_0_#0505050d]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">
            Poll #{pollId}
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{poll.title}</h1>
          <p className="mt-4 max-w-xl text-sm text-black/70">
            {poll.description}
          </p>
        </div>
        <span className="self-end text-xs uppercase tracking-[0.3em] text-black">
          {badge}
        </span>
      </div>
      <div className="mt-8 h-20 w-full rounded-[28px] border border-black bg-black/5" />
      <p className="mt-6 text-center text-base font-semibold md:text-left">
        {poll.timeframe.start} — {poll.timeframe.end}
      </p>
    </section>
  );
}

function PrepareSection({ poll }: { poll: PollData }) {
  const isDeployed = Boolean(poll.onChainId && poll.onChainId !== "0");
  const isCancelled = poll.status === PollStatus.Cancelled;
  const canSubmit = !isDeployed && !isCancelled;

  // Debug: Log poll.ideas to verify _id is present
  console.log("PrepareSection render - poll.ideas:", poll.ideas);
  console.log(
    "PrepareSection render - first idea:",
    poll.ideas[0],
    "first idea._id:",
    poll.ideas[0]?._id
  );

  return (
    <section className="space-y-8">
      {canSubmit ? (
        <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="text-lg font-semibold">
            Have your own idea? Bring it to the world.
          </p>
          <IdeaSubmitFormTrigger className="rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black">
            Submit new idea
          </IdeaSubmitFormTrigger>
        </div>
      ) : (
        <div className="rounded-[32px] border border-gray-200 bg-gray-50 px-6 py-5 text-center text-gray-500">
          {isCancelled
            ? "This poll has been cancelled. No new submissions."
            : "Poll has started. New submissions are closed."}
        </div>
      )}

      {/* Approved Ideas Section */}
      {poll.approvedIdeas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-800">
            Approved Competitors
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poll.approvedIdeas.map((idea) => (
              <article
                key={idea._id}
                className="flex h-full flex-col gap-4 rounded-[32px] border border-emerald-500 bg-emerald-50/50 p-6"
              >
                <div className="h-24 rounded-2xl border border-emerald-200 bg-white" />
                <div>
                  <h3 className="mt-1 text-xl font-semibold text-emerald-900">
                    {idea.title}
                  </h3>
                  <p className="mt-2 text-sm text-emerald-800/70">
                    {idea.summary}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-600">
                    Creator · {idea.creator}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Approved
                  </span>
                  <Link
                    href={`/votes/${idea._id}`}
                    className="rounded-full border border-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-900 hover:bg-emerald-100"
                  >
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Pending Ideas Section */}
      <div>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Pending Review
          </p>
          <h2 className="text-3xl font-semibold">Community Ideas</h2>
        </div>

        {poll.ideas.length === 0 ? (
          <p className="text-gray-500 italic">No pending ideas.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poll.ideas.map((idea) => (
              <article
                key={idea._id}
                className="flex h-full flex-col gap-4 rounded-[32px] border border-black bg-white p-6"
              >
                <div className="h-24 rounded-2xl border border-black bg-black/5" />
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                    ID: {idea._id.slice(0, 8)}...
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{idea.title}</h3>
                  <p className="mt-2 text-sm text-black/70">{idea.summary}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/60">
                    Creator · {idea.creator}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Pending
                  </span>
                  <Link
                    href={`/votes/${idea._id}`}
                    className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
                  >
                    Read detail
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VotingSection({ poll }: { poll: PollData }) {
  const { fetchMetadata } = useIPFS();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const { updatePollStatus } = usePolls();
  const [showSignup, setShowSignup] = useState(false); // Add state
  const { signupToMaci } = useMaci();
  // Check if joined - check for pollStateIndex (preferred) or stateIndex (backward compat)
  const [isJoined, setIsJoined] = useState(false);
  const [joinedPollStateIndex, setJoinedPollStateIndex] = useState<
    string | null
  >(null);

  useEffect(() => {
    // User requested to NOT rely on local state for "Joined" status.
    // Instead, we let the user click "Join Poll" and let the contract check validity.
    // So we don't auto-set isJoined = true here anymore.
    const storedStateIndex = localStorage.getItem("maci_state_index");
    if (storedStateIndex) {
        // Just setting this up for context, but isJoined remains false to force interaction/check
        // Or if we want to be nice, we can keep it, but user said "don't save state".
        // I will follow instructions: Do NOT auto-set isJoined based on poll status.
    }
  }, []);

  useEffect(() => {
    console.log("VotingSection - poll.options:", poll.options);
    console.log("VotingSection - poll.ideas:", poll.ideas);

    // If options exist, fetch from IPFS
    if (poll.options && poll.options.length > 0) {
      Promise.all(
        poll.options.map(async (id) => {
          const metadata = await fetchMetadata(id);
          console.log(`Fetched metadata for ${id}:`, metadata);
          if (!metadata) return null;
          // Inject the CID (id) as the _id so links work correctly
          return { ...metadata, _id: id };
        })
      ).then((results) => {
        const validIdeas = results.filter((i): i is Idea => i !== null);
        setIdeas(validIdeas);
      });
    } else if (poll.ideas && poll.ideas.length > 0) {
      // Fallback to poll.ideas if options is empty
      setIdeas(poll.ideas);
    }
  }, [poll.options, poll.ideas, fetchMetadata]);

  console.log("Resolved ideas for voting:", ideas);

  const highlightedIdeaId =
    ideas.length > 0
      ? ideas.reduce((top, idea) => (idea.credits > top.credits ? idea : top))
          ._id
      : undefined;

  const { tallyVotes } = useResults();
  const handleTally = async () => {
    console.log("Tallying votes for poll...");
    const pollId = poll.id;
    await tallyVotes(pollId);
    await updatePollStatus(pollId, PollStatus.Ended);
  };

  // Handle MACI signup only (separate from join poll)
  const handleMaciSignup = async () => {
    try {
      console.log("Signing up to MACI...");
      // Call hook wrapper (which calls useMaciSignup)
      // No args needed as hook generates keys
      const result = await signupToMaci();

      console.log("MACI Signup successful:", result);
      alert(`MACI Signup successful! State Index: ${result.stateIndex}`);
    } catch (error: any) {
      console.error("MACI Signup failed:", error);
      alert(`MACI Signup failed: ${error.message}`);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Spend credit
          </p>
          <p className="text-3xl font-semibold">
            {poll.credits.spent}{" "}
            <span className="text-black/40">/ {poll.credits.total}</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-[0.3em] sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleMaciSignup}
            className="rounded-full border border-purple-500 px-6 py-3 text-purple-700 hover:bg-purple-50"
          >
            Sign Up to MACI
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowSignup(true)}
            className={`rounded-full border px-6 py-3 ${isJoined ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-black text-black hover:bg-black/5"}`}
          >
            {isJoined
              ? `Joined (#${joinedPollStateIndex})`
              : "Join Poll (Sign Up)"}
          </Button>
          <Button
            variant="ghost"
            className="rounded-full border border-black px-6 py-3 text-black hover:bg-black/5"
          >
            View ledger
          </Button>
          <Button className="rounded-full border border-black bg-black px-6 py-3 text-white hover:bg-black">
            Buy credit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {ideas.map((idea) => {
          const isHighlighted =
            highlightedIdeaId != null && idea._id === highlightedIdeaId;

          return (
            <article
              key={idea._id}
              className={`relative flex h-full flex-col gap-4 rounded-[32px] border bg-white p-6 ${isHighlighted ? "border-[#2563eb] shadow-[0_0_0_2px_#2563eb33]" : "border-black"}`}
            >
              <div className="h-24 rounded-2xl border border-black bg-black/5" />
              <div>
                <h3 className="text-xl font-semibold">{idea.title}</h3>
                <p className="mt-2 text-sm text-black/70">{idea.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/60">
                  Creator · {idea.creator}
                </p>
              </div>
              <span className="absolute right-6 top-6 rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {idea.credits} cr
              </span>
              <Link
                href={`/votes/${idea._id}`}
                className="mt-auto rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
              >
                Read detail
              </Link>
            </article>
          );
        })}
      </div>

      {/* Note: VoteForm removed as requested by user to avoid confusion */}

      <div className="flex justify-center pt-8">
        <Button
          onClick={() => handleTally()}
          className="rounded-full border border-black bg-gray-200 px-8 py-6 text-lg font-bold text-black hover:bg-gray-300"
        >
          Tally Votes (Admin)
        </Button>
      </div>

      <SignupModal
        open={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={() => setIsJoined(true)}
        pollId={poll.id}
        pollIdOnChain={Number(poll.onChainId)}
        maciAddress={process.env.NEXT_PUBLIC_MACI_ADDRESS || ""}
      />
    </section>
  );
}

function SignupModal({
  open,
  onClose,
  onSuccess,
  pollId,
  pollIdOnChain,
  maciAddress,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pollId: string;
  pollIdOnChain: number;
  maciAddress: string;
}) {
  const { signupToMaci, joinMaciPoll, loading } = useMaci();
  const [privKey, setPrivKey] = useState("");
  // Default: if no existing key, perform signup (random). If existing key, use it.
  const [useRandomKey, setUseRandomKey] = useState(true);
  const [useExistingKey, setUseExistingKey] = useState(false);

  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [existingPollStateIndex, setExistingPollStateIndex] = useState<
    string | null
  >(null);
  const [existingVoiceCredits, setExistingVoiceCredits] = useState<
    string | null
  >(null);

  const [joinSuccess, setJoinSuccess] = useState(false);
  const [newPollStateIndex, setNewPollStateIndex] = useState<string | null>(
    null
  );
  const [newVoiceCredits, setNewVoiceCredits] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const storedPollStateIndex = localStorage.getItem(
        "maci_poll_state_index"
      );
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

        // If not joined this poll, but has MACI identity
        if (storedPrivKey) {
          setUseExistingKey(true);
          setUseRandomKey(false); // Make manual/random optional
        } else {
          setUseExistingKey(false);
          setUseRandomKey(true); // Default to new random for fresh user
        }
      }
      setJoinSuccess(false);
      setNewPollStateIndex(null);
      setNewVoiceCredits(null);
    }
  }, [open]);

  const handleSignup = async () => {
    if (alreadyJoined) return;

    try {
      if (useExistingKey) {
        console.log("Using existing identity found in storage...");
        const storedPubKey = localStorage.getItem("maci_pub_key");
        const storedPrivKey = localStorage.getItem("maci_priv_key");
        console.log("Stored keys:", {
          pubKey: storedPubKey?.substring(0, 30),
          privKey: storedPrivKey?.substring(0, 30),
        });
        // No signup needed, just join poll
      } else if (useRandomKey) {
        console.log("Signing up to MACI (New Identity)...");
        await signupToMaci();
        // Wait for transaction to be indexed before joining poll
        console.log("Waiting for signup transaction to be indexed...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        // Manual Import
        if (!privKey) return alert("Enter secret key or use random generation");

        console.log("Importing existing key...");
        try {
          let finalKey = privKey.trim();
          if (!finalKey.startsWith("macisk")) {
            console.log("Attempting to normalize raw private key input...");
            const { PrivateKey } = await import("@maci-protocol/domainobjs");
            const rawPKey = PrivateKey.deserialize(finalKey);
            finalKey = rawPKey.serialize();
          }

          localStorage.setItem("maci_priv_key", finalKey);

          const { PrivateKey, Keypair } = await import(
            "@maci-protocol/domainobjs"
          );
          const pKey = PrivateKey.deserialize(finalKey);
          const kPair = new Keypair(pKey);
          localStorage.setItem("maci_pub_key", kPair.pubKey.serialize());
        } catch (e) {
          console.error("Invalid key", e);
          throw new Error(
            "Invalid private key format. Expected 'macisk...' or valid raw key."
          );
        }
      }

      console.log("Joining Poll...");
      const joinResult = await joinMaciPoll(String(pollIdOnChain), 0, "", 0);

      // Handle Already Joined Case
      if (joinResult.alreadyJoined) {
          alert("Note: You have already joined this poll! treating as success.");
          // If we don't have the real index, we might default to localStorage or 0.
          // For now, we proceed.
      }

      setJoinSuccess(true);
      // setIsJoined is handled by onSuccess callback in parent
      setNewPollStateIndex(joinResult.pollStateIndex || null);
      setNewVoiceCredits(joinResult.voiceCredits || null);

      if (joinResult.pollStateIndex) {
        localStorage.setItem(
          "maci_poll_state_index",
          joinResult.pollStateIndex
        );
      }
      if (joinResult.voiceCredits) {
        localStorage.setItem("maci_voice_credits", joinResult.voiceCredits);
      }

      onSuccess();
    } catch (e: any) {
      console.error("Signup/Join failed", e);
      alert("Signup/Join failed: " + e.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-[32px] border-2 border-black w-full max-w-md flex flex-col gap-4">
        <h3 className="text-xl font-bold">Join Poll</h3>

        {joinSuccess ? (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-emerald-800 font-semibold">
                  Successfully Joined!
                </p>
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                You are now registered to vote.
              </p>
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
              <Button
                onClick={onClose}
                className="bg-emerald-600 text-white rounded-full px-6 hover:bg-emerald-700"
              >
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
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Generate or provide a MACI identity to participate.
            </p>

            {useExistingKey ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-semibold">
                  Existing Identity Found
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Your saved MACI Key will be used to join this poll.
                </p>

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

            <div className="flex justify-end gap-2">
              <Button onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                onClick={handleSignup}
                disabled={loading}
                className="bg-black text-white rounded-full px-6"
              >
                {loading ? "Joining..." : "Join Poll"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EndedSection({ poll }: { poll: PollData }) {
  const { mergePoll, generateProofs, submitProofs } = useMaci();
  const [tallying, setTallying] = useState(false);
  const [tallyStatus, setTallyStatus] = useState("");

  const handleTally = async () => {
    if (
      !confirm(
        "This will trigger MACI Tallying (Merge -> Prove -> Submit). It may take a long time. Continue?"
      )
    )
      return;

    const pollId = poll.onChainId;
    if (pollId === undefined || pollId === null || pollId === "") {
      alert("Invalid Poll ID (On-Chain ID missing). Cannot tally.");
      return;
    }

    // Get MACI Address and Start Block from LocalStorage (critical for dynamic deployments)
    const maciAddress = localStorage.getItem("maciAddress") || undefined;
    let startBlock = 0;
    try {
      const storedStartBlock = localStorage.getItem("maciStartBlock");
      if (storedStartBlock) startBlock = Number(storedStartBlock);
    } catch (e) {
      console.warn("Could not read maciStartBlock from localStorage");
    }

    if (!maciAddress) {
      if (
        !confirm(
          "MACI Address not found in LocalStorage. The server will use its default (env) address. This might fail if you redeployed MACI. Continue?"
        )
      ) {
        return;
      }
    }

    setTallying(true);
    setTallyStatus("Merging Poll...");
    try {
      await mergePoll(pollId, maciAddress);

      setTallyStatus("Generating Proofs (this takes time)...");
      await generateProofs(pollId, maciAddress, startBlock);

      setTallyStatus("Submitting Proofs...");
      await submitProofs(pollId, maciAddress);

      setTallyStatus("Done! Refreshing...");
      window.location.reload();
    } catch (e: any) {
      console.error("Tally failed:", e);
      alert("Tally validation/execution failed: " + e.message);
      setTallyStatus("Failed.");
    } finally {
      setTallying(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Spend credit
          </p>
          <p className="text-3xl font-semibold">
            {poll.credits.spent}{" "}
            <span className="text-black/40">/ {poll.credits.total}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {tallying && (
            <span className="text-xs font-mono text-emerald-600 animate-pulse">
              {tallyStatus}
            </span>
          )}
          <Button
            variant="ghost"
            className="rounded-full border border-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
          >
            View ledger
          </Button>
          {poll.results.length === 0 && (
            <Button
              onClick={handleTally}
              disabled={tallying}
              className="rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black/80 disabled:opacity-50"
            >
              {tallying ? "Tallying..." : "Tally Results (Admin)"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {poll.results.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>Results are being tallied or pending calculation.</p>
            <p className="text-sm mt-2">
              If you are an admin, click "Tally Results" above.
            </p>
          </div>
        )}
        {poll.results.map((result, index) => (
          <article
            key={result.id}
            className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-4 md:w-64">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-black text-base font-semibold ${index === 0 ? "bg-black text-white" : "bg-white text-black"}`}
              >
                {index + 1}
              </div>
              <div>
                <p className="text-lg font-semibold uppercase">
                  {result.label}
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-black/60">
                  {result.author}
                </p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm font-semibold text-black/70">
                <span>{result.votes} votes</span>
                <span>{result.percentage}%</span>
              </div>
              <div className="mt-2 h-4 w-full overflow-hidden rounded-full border border-black bg-white">
                <div
                  className="h-full bg-black"
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
