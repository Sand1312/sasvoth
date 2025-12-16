import { delay, http, HttpResponse } from "msw";
import { db, nextId } from "../db";

const API_BASES = Array.from(
  new Set(
    [
      "/api",
      process.env.NEXT_PUBLIC_API_URL,
      typeof process !== "undefined" ? process.env.API_URL : undefined,
      "http://localhost:8000",
    ]
      .filter(Boolean)
      .map((base) => {
        const normalized = (base as string).trim();
        return normalized === "/api"
          ? normalized
          : normalized.replace(/\/$/, "");
      })
  )
);

const buildTargets = (path: string) =>
  API_BASES.map((base) => {
    if (base === "/api") {
      return `${base}${path}`;
    }
    return `${base}${path}`;
  });

const ideaTargets = {
  create: buildTargets("/v1/ideas"),
  byId: (id: string) => buildTargets(`/v1/ideas/${id}`),
  updateCid: (id: string) => buildTargets(`/v1/ideas/${id}/cid`),
};

const pollTargets = {
  create: buildTargets("/v1/polls"),
  list: buildTargets("/v1/polls"),
  byId: (id: string) => buildTargets(`/v1/polls/${id}`),
  updateStatus: (id: string) => buildTargets(`/v1/polls/${id}/status`),
  addIdea: (id: string) => buildTargets(`/v1/polls/${id}/ideas`),
  approveIdea: (id: string) => buildTargets(`/v1/polls/${id}/approve`),
  saveOnChainId: (id: string) => buildTargets(`/v1/polls/${id}/onchain-id`),
};

const voteTargets = {
  create: buildTargets("/v1/votes"),
  list: buildTargets("/v1/votes"),
};

const voiceCreditTargets = {
  purchase: buildTargets("/v1/voice-credits/purchase"),
  consume: buildTargets("/v1/voice-credits/consume"),
  get: buildTargets("/v1/voice-credits"),
};

const resultMetaTargets = {
  save: buildTargets("/v1/results/meta"),
  byPoll: (pollId: string) => buildTargets(`/v1/results/meta/${pollId}`),
  all: buildTargets("/v1/results/meta"),
};

const rewardTargets = {
  create: buildTargets("/v1/rewards"),
  list: buildTargets("/v1/rewards"),
};

const ok = <T>(data: T, status = 200) => HttpResponse.json(data as any, { status });

const notFound = (message: string) =>
  HttpResponse.json({ message }, { status: 404 });

const invalid = (message: string) =>
  HttpResponse.json({ message }, { status: 400 });

const ensureBody = async <T>(request: Request) =>
  (await request.json().catch(() => ({}))) as T;

const withLatency = async <T>(result: T, ms = 150) => {
  await delay(ms);
  return result;
};

export const v1Handlers = [
  // Ideas
  ...ideaTargets.create.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<{
        pollData?: Partial<(typeof db.ideas)[number]>;
        idea?: Partial<(typeof db.ideas)[number]>;
      }>(request);
      const payload = (body.pollData ?? body.idea) as any;
      if (!payload?.title) {
        return invalid("title is required");
      }
      const newIdea = {
        id: nextId("idea"),
        title: payload.title,
        description: payload.description ?? "",
        descriptionMore: payload.descriptionMore ?? payload.description ?? "",
        imgSrc:
          payload.imgSrc ??
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
        creatorAddress:
          payload.creatorAddress ??
          "0x0000000000000000000000000000000000000000",
        creatorIdea: payload.creatorIdea ?? "anonymous",
        idea_cid: payload.idea_cid ?? null,
      } satisfies (typeof db.ideas)[number];
      db.ideas.push(newIdea);
      return withLatency(ok({ idea: newIdea }, 201));
    })
  ),
  ...ideaTargets.byId(":id").map((target) =>
    http.get(target, async ({ params }) => {
      const idea = db.ideas.find((item) => item.id === params.id);
      await delay(100);
      if (!idea) return notFound("Idea not found");
      return ok(idea);
    })
  ),
  ...ideaTargets.updateCid(":id").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{ idea_cid?: string; ideaId?: string }>(
        request
      );
      const idea = db.ideas.find(
        (item) => item.id === (params.id || body.ideaId)
      );
      if (!idea) return notFound("Idea not found");
      if (!body.idea_cid) return invalid("idea_cid is required");
      idea.idea_cid = body.idea_cid;
      return withLatency(ok({ idea }));
    })
  ),
  ...ideaTargets.byId(":id").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{
        ideaId?: string;
        updateData?: Partial<(typeof db.ideas)[number]>;
      }>(request);
      const idea = db.ideas.find(
        (item) => item.id === (params.id || body.ideaId)
      );
      if (!idea) return notFound("Idea not found");
      const updates = body.updateData ?? body;
      Object.assign(idea, updates);
      return withLatency(ok({ idea }));
    })
  ),

  // Polls
  ...pollTargets.create.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<{
        pollData?: Partial<(typeof db.polls)[number]>;
      }>(request);
      const payload = (body.pollData ?? body) as any;
      if (!payload.title || !payload.status) {
        return invalid("title and status are required");
      }
      const newPoll = {
        id: nextId("poll"),
        title: payload.title,
        description: payload.description ?? "",
        creatorAddress:
          payload.creatorAddress ??
          "0x0000000000000000000000000000000000000000",
        status: payload.status,
        startTime: payload.startTime ?? new Date().toISOString(),
        endTime:
          payload.endTime ??
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        options: payload.options ?? [],
        pollIdOnChain: payload.pollIdOnChain ?? null,
        ideaIds: payload.ideaIds ?? [],
        approvedIdeaIds: payload.approvedIdeaIds ?? [],
      } satisfies (typeof db.polls)[number];
      db.polls.push(newPoll);
      return withLatency(ok({ poll: newPoll }, 201));
    })
  ),
  ...pollTargets.list.map((target) =>
    http.get(target, async ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      await delay(120);
      const polls = status
        ? db.polls.filter((poll) => poll.status === status)
        : db.polls;
      return ok({ polls });
    })
  ),
  ...pollTargets.byId(":pollId").map((target) =>
    http.get(target, async ({ params }) => {
      const poll = db.polls.find((item) => item.id === params.pollId);
      await delay(100);
      if (!poll) return notFound("Poll not found");
      return ok(poll);
    })
  ),
  ...pollTargets.updateStatus(":pollId").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{ pollId?: string; status?: string }>(
        request
      );
      const poll = db.polls.find(
        (item) => item.id === (params.pollId || body.pollId)
      );
      if (!poll) return notFound("Poll not found");
      if (!body.status) return invalid("status is required");
      poll.status = body.status;
      return withLatency(ok({ poll }));
    })
  ),
  ...pollTargets.addIdea(":pollId").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{ pollId?: string; ideaId?: string }>(
        request
      );
      const poll = db.polls.find(
        (item) => item.id === (params.pollId || body.pollId)
      ) as any;
      if (!poll) return notFound("Poll not found");
      if (!body.ideaId) return invalid("ideaId is required");
      if (!poll.ideaIds.includes(body.ideaId)) {
        poll.ideaIds.push(body.ideaId);
      }
      return withLatency(ok({ poll }));
    })
  ),
  ...pollTargets.approveIdea(":pollId").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{ pollId?: string; ideaId?: string }>(
        request
      );
      const poll = db.polls.find(
        (item) => item.id === (params.pollId || body.pollId)
      ) as any;
      if (!poll) return notFound("Poll not found");
      if (!body.ideaId) return invalid("ideaId is required");
      if (!poll.approvedIdeaIds.includes(body.ideaId)) {
        poll.approvedIdeaIds.push(body.ideaId);
      }
      return withLatency(ok({ poll }));
    })
  ),
  ...pollTargets.saveOnChainId(":pollId").map((target) =>
    http.patch(target, async ({ params, request }) => {
      const body = await ensureBody<{
        pollId?: string;
        pollIdOnChain?: number | null;
      }>(request);
      const poll = db.polls.find(
        (item) => item.id === (params.pollId || body.pollId)
      );
      if (!poll) return notFound("Poll not found");
      poll.pollIdOnChain = body.pollIdOnChain ?? poll.pollIdOnChain;
      return withLatency(ok({ poll }));
    })
  ),

  // Votes
  ...voteTargets.list.map((target) =>
    http.get(target, async ({ request }) => {
      const url = new URL(request.url);
      const pollId = url.searchParams.get("pollId") ?? undefined;
      const userId = url.searchParams.get("userId") ?? undefined;
      await delay(80);
      const votes = db.votes.filter((vote) => {
        if (pollId && vote.pollId !== pollId) return false;
        if (userId && vote.userId !== userId) return false;
        return true;
      });
      return ok({ votes });
    })
  ),
  ...voteTargets.create.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<{
        voteData?: Partial<(typeof db.votes)[number]>;
      }>(request);
      const payload = (body.voteData ?? body) as any;
      if (!payload.pollId || !payload.userId || !payload.selectedOption) {
        return invalid("pollId, userId, and selectedOption are required");
      }
      const newVote = {
        id: nextId("vote"),
        voterId: payload.voterId ?? payload.userId,
        pollId: payload.pollId,
        selectedOption: payload.selectedOption,
        timestamp: payload.timestamp ?? new Date().toISOString(),
        weight: payload.weight ?? 1,
        userId: payload.userId,
        voteCommitment: payload.voteCommitment ?? nextId("commit"),
      } satisfies (typeof db.votes)[number];
      db.votes.push(newVote);
      return withLatency(ok({ votes: [newVote] }, 201));
    })
  ),

  // Voice credits
  ...voiceCreditTargets.purchase.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<VoicePayload>(request);
      if (!body.userId || !body.pollId || typeof body.credits !== "number") {
        return invalid("userId, pollId, and credits are required");
      }
      const record = findVoiceCredit(body.userId, body.pollId);
      if (!record) {
        db.voiceCredits.push({
          userId: body.userId,
          pollId: body.pollId,
          credits: body.credits,
        });
      } else {
        record.credits += body.credits;
      }
      return withLatency(ok({ credits: body.credits }, 201));
    })
  ),
  ...voiceCreditTargets.consume.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<VoicePayload>(request);
      if (!body.userId || !body.pollId || typeof body.credits !== "number") {
        return invalid("userId, pollId, and credits are required");
      }
      const record = findVoiceCredit(body.userId, body.pollId);
      if (!record) return notFound("Voice credit record not found");
      record.credits = Math.max(0, record.credits - body.credits);
      return withLatency(ok({ credits: record.credits }));
    })
  ),
  ...voiceCreditTargets.get.map((target) =>
    http.get(target, async ({ request }) => {
      const url = new URL(request.url);
      const pollId = url.searchParams.get("pollId") ?? undefined;
      const userId = url.searchParams.get("userId") ?? undefined;
      const record = findVoiceCredit(userId, pollId);
      await delay(60);
      if (!record) return notFound("Voice credit record not found");
      return ok({ credits: record.credits });
    })
  ),

  // Results meta
  ...resultMetaTargets.save.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<ResultPayload>(request);
      if (!body.pollId || !body.result_cid) {
        return invalid("pollId and result_cid are required");
      }
      const existing = db.resultsMeta.find(
        (result) => result.pollId === body.pollId
      );
      const payload = {
        pollId: body.pollId,
        result_cid: body.result_cid,
        outcome: body.outcome ?? "",
        updatedAt: new Date().toISOString(),
      } satisfies (typeof db.resultsMeta)[number];
      if (existing) {
        Object.assign(existing, payload);
      } else {
        db.resultsMeta.push(payload);
      }
      return withLatency(ok({ result: payload }, 201));
    })
  ),
  ...resultMetaTargets.byPoll(":pollId").map((target) =>
    http.get(target, async ({ params }) => {
      const result = db.resultsMeta.find(
        (item) => item.pollId === params.pollId
      );
      await delay(60);
      if (!result) return notFound("Result not found");
      return ok({ result });
    })
  ),
  ...resultMetaTargets.all.map((target) =>
    http.get(target, async () => {
      await delay(60);
      return ok({ results: db.resultsMeta });
    })
  ),

  // Rewards
  ...rewardTargets.create.map((target) =>
    http.post(target, async ({ request }) => {
      const body = await ensureBody<RewardPayload>(request);
      if (!body.userId || !body.pollId)
        return invalid("userId and pollId are required");
      const existing = db.rewards.find(
        (item) => item.userId === body.userId && item.pollId === body.pollId
      );
      const payload = {
        userId: body.userId,
        pollId: body.pollId,
        credit_count: body.credit_count ?? body.creditCount ?? 0,
      } satisfies (typeof db.rewards)[number];
      if (existing) {
        Object.assign(existing, payload);
      } else {
        db.rewards.push(payload);
      }
      return withLatency(ok({ reward: payload }, 201));
    })
  ),
  ...rewardTargets.list.map((target) =>
    http.get(target, async ({ request }) => {
      const url = new URL(request.url);
      const pollId = url.searchParams.get("pollId") ?? undefined;
      const userId = url.searchParams.get("userId") ?? undefined;
      await delay(60);
      const rewards = db.rewards.filter((reward) => {
        if (pollId && reward.pollId !== pollId) return false;
        if (userId && reward.userId !== userId) return false;
        return true;
      });
      return ok({ rewards });
    })
  ),
];

type VoicePayload = { userId: string; pollId: string; credits: number };
type ResultPayload = { pollId: string; result_cid: string; outcome?: string };
type RewardPayload = {
  userId: string;
  pollId: string;
  credit_count?: number;
  creditCount?: number;
};

function findVoiceCredit(userId?: string, pollId?: string) {
  if (!userId || !pollId) return undefined;
  return db.voiceCredits.find(
    (record) => record.userId === userId && record.pollId === pollId
  );
}
