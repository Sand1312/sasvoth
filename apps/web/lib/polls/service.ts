import { PollStatus } from "@/types/polls";
import { derivePollStatus } from "./utils";

export type Timeline = { start: string; end: string };

export type Idea = {
  _id: string;
  title: string;
  summary: string;
  credits: number;
  votes: number;
  creator: string;
  logo?: string;
};

export type TallyResult = {
  id: string;
  label: string;
  votes: number;
  percentage: number;
  author: string;
};

export type PollData = {
  id: string;
  onChainId: string;
  title: string;
  description: string;
  timeframe: Timeline;
  credits: { spent: number; total: number; remaining?: number };
  status: PollStatus;
  ideas: Idea[];
  approvedIdeas: Idea[];
  options: string[];
  results: TallyResult[];
};

// Raw types from API
type ApiIdea = {
  _id?: string;
  title?: string;
  description?: string;
  descriptionMore?: string;
  creatorIdea?: string;
  creatorAddress?: string;
  idea_cid?: string;
  imgSrc?: string;
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
  approvedIdeaIds?: string[];
  options?: string[];
  results?: TallyResult[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
  approvedIdeas: [],
  options: [],
  results: [],
};

// Helper to fetch IPFS or API content
async function fetchContent(id: string): Promise<ApiIdea | null> {
  try {
    const isCid = id.length > 24 || id.startsWith("Qm") || id.startsWith("baf");
    const url = isCid
      ? `${API_BASE_URL}/ipfs/${id}`
      : `${API_BASE_URL}/ideas/${id}`; // Assuming separate ideas endpoint exists or handled via IPFS logic

    // If it's a standard ID, originally the code called ideasApi.getIdeaById
    // If we assume everything interesting is IPFS or normalized:
    
    // Note: The original client code distinguishes between IPFS CIDs and DB IDs.
    // For IPFS, it calls `ipfsApi.getById` which calls `/api/v1/ipfs/:cid`.
    // For DB IDs, it calls `ideasApi.getIdeaById`.
    
    // We strictly use the backend URL here.
    const res = await fetch(url, {
        cache: 'force-cache', 
        next: { tags: [`content-${id}`] }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch content ${id}`, error);
    return null;
  }
}

function normalizeIdea(idea: ApiIdea, fallbackId: string): Idea {
  const resolvedId =
    idea._id && idea._id.length > 0
      ? idea._id
      : idea.idea_cid && idea.idea_cid.length > 0
      ? idea.idea_cid
      : fallbackId;

  return {
    _id: resolvedId,
    title: idea.title ?? "Untitled idea",
    summary: idea.description ?? idea.descriptionMore ?? "",
    credits: 0,
    votes: 0,
    creator: idea.creatorIdea ?? idea.creatorAddress ?? "",
    logo: idea.imgSrc,
  };
}

export async function hydrateIdeas(
  ideasOrIds: (string | ApiIdea)[] | undefined
): Promise<Idea[]> {
  if (!ideasOrIds || ideasOrIds.length === 0) return [];

  if (typeof ideasOrIds[0] === "string") {
    const ids = ideasOrIds as string[];
    const fetched = await Promise.all(ids.map(id => fetchContent(id)));
    return fetched
      .map((data, idx) => (data ? normalizeIdea(data, ids[idx] ?? "") : null))
      .filter((i): i is Idea => i !== null);
  }

  return (ideasOrIds as ApiIdea[]).map((idea) =>
    normalizeIdea(idea, idea._id || "")
  );
}

export async function getPollById(id: string): Promise<PollData> {
  try {
    const res = await fetch(`${API_BASE_URL}/polls/${id}`, {
      cache: "no-store", // Poll status changes often, or use revalidate time
      // next: { tags: [`poll-${id}`], revalidate: 60 } 
    });

    if (!res.ok) {
        // Fallback for 404 or error
        console.error(`Fetch poll ${id} failed: ${res.status}`);
        return fallbackPoll; 
    }

    const data = await res.json();
    const source = (data.poll ?? data) as ApiPoll;

    // Parallelize idea fetching
    const [ideas, approvedIdeas] = await Promise.all([
      hydrateIdeas(
        source.ideas && source.ideas.length > 0 ? source.ideas : source.ideaIds
      ),
      hydrateIdeas(
        source.options && source.options.length > 0
          ? source.options
          : source.approvedIdeaIds
      ),
    ]);

    const timeframeStart =
      (typeof source.startTime === "string"
        ? source.startTime
        : source.startTime?.toString()) ?? source.timeframe?.start;
    const timeframeEnd =
      (typeof source.endTime === "string"
        ? source.endTime
        : source.endTime?.toString()) ?? source.timeframe?.end;

    // Derive Status
    const derivedStatus = derivePollStatus({
        startTime: source.startTime,
        endTime: source.endTime,
        timeframe: source.timeframe,
        pollIdOnChain: source.pollIdOnChain,
        status: source.status
    });

    return {
      id: source._id ?? id,
      onChainId: source.pollIdOnChain?.toString() ?? "0",
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
      options: source.options ?? [],
      results: source.results ?? [],
    };

  } catch (error) {
    console.error("getPollById error:", error);
    return fallbackPoll;
  }
}
