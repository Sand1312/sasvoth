import { api } from "./base";
import { PollStatus } from "@/types/polls";

export type CreatePollPayload = {
  title: string;
  description: string;
  creatorAddress: string;
  numberOptions: number;
  startTime: Date;
  endTime: Date;
};

/**
 * Polls API - RESTful Resource-Oriented
 *
 * Resource: /polls
 * Sub-resource: /polls/:id/ideas
 * Sub-resource: /polls/:id/status
 * Sub-resource: /polls/:id/chain
 *
 * GET    /polls              - List all polls
 * POST   /polls              - Create a new poll
 * GET    /polls/:id          - Get a specific poll
 * PATCH  /polls/:id          - Update a poll
 * DELETE /polls/:id          - Delete a poll
 * GET    /polls?status=X     - Filter polls by status
 * PATCH  /polls/:id/status   - Update poll status
 * POST   /polls/:id/ideas    - Add idea to poll
 * PATCH  /polls/:id/ideas/:ideaId/approve - Approve idea in poll
 * PATCH  /polls/:id/chain    - Update on-chain ID
 */
export const pollsApi = {
  /**
   * Get all polls, optionally filtered by status
   * GET /polls or GET /polls?status=X
   */
  getAll: async (status?: PollStatus) => {
    const params = status ? { status } : undefined;
    const response = await api.get("/polls", { params });

    const polls = Array.isArray(response.data?.polls)
      ? response.data.polls
      : Array.isArray(response.data)
        ? response.data
        : [];

    return polls.map((poll: Record<string, unknown>) => ({
      ...poll,
      _id:
        (poll as { _id?: string })._id ||
        (poll as { id?: string }).id ||
        (poll as { pollId?: string | number }).pollId ||
        (poll as { pollIdOnChain?: string | number }).pollIdOnChain?.toString(),
    }));
  },

  /**
   * Create a new poll
   * POST /polls
   */
  create: async (payload: CreatePollPayload) => {
    const response = await api.post("/polls", {
      ...payload,
      status: PollStatus.Prepare,
    });
    return response.data;
  },

  /**
   * Get a specific poll by ID
   * GET /polls/:id
   */
  getById: async (id: string) => {
    const response = await api.get(`/polls/${id}`);
    return response.data?.poll ?? response.data;
  },

  /**
   * Get poll by option CID (idea CID in options[])
   * GET /polls/by-option/:optionCid
   */
  getByOptionCid: async (optionCid: string) => {
    const response = await api.get(`/polls/by-option/${optionCid}`);
    return response.data?.poll ?? response.data;
  },

  /**
   * Update a poll
   * PATCH /polls/:id
   */
  update: async (id: string, data: Partial<CreatePollPayload>) => {
    const response = await api.patch(`/polls/${id}`, data);
    return response.data?.poll ?? response.data;
  },

  /**
   * Delete a poll
   * DELETE /polls/:id
   */
  delete: async (id: string) => {
    const response = await api.delete(`/polls/${id}`);
    return response.data;
  },

  /**
   * Update poll status
   * PATCH /polls/:id/status
   */
  updateStatus: async (id: string, status: PollStatus | string) => {
    const response = await api.patch(`/polls/${id}/status`, { status });
    return response.data?.poll ?? response.data;
  },

  /**
   * Add idea to poll
   * POST /polls/:id/ideas
   */
  addIdea: async (pollId: string, ideaId: string) => {
    const response = await api.post(`/polls/${pollId}/ideas`, { ideaId });
    return response.data?.poll ?? response.data;
  },

  /**
   * Approve idea in poll
   * PATCH /polls/:pollId/ideas/:ideaId/approve
   */
  approveIdea: async (pollId: string, ideaId: string, ideaCid: string) => {
    const response = await api.patch(
      `/polls/${pollId}/ideas/${ideaId}/approve`,
      {
        ideaCid,
      }
    );
    return response.data?.poll ?? response.data;
  },

  /**
   * Update on-chain ID
   * PATCH /polls/:id/chain
   */
  updateChainId: async (id: string, chainId: string, subgraphUrl?: string) => {
    const response = await api.patch(`/polls/${id}/chain`, {
      pollIdOnChain: chainId,
      subgraphUrl,
    });
    return response.data?.poll ?? response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use create instead */
  createPoll: async (
    title: string,
    description: string,
    creatorAddress: string,
    numberOptions: number,
    startTime: Date,
    endTime: Date
  ) =>
    pollsApi.create({
      title,
      description,
      creatorAddress,
      numberOptions,
      startTime,
      endTime,
    }),
  /** @deprecated Use getAll instead */
  getPolls: async (status?: PollStatus) => pollsApi.getAll(status),
  /** @deprecated Use getById instead */
  getPollById: async (pollId: string) => pollsApi.getById(pollId),
  /** @deprecated Use updateStatus instead */
  updatePollStatus: async (pollId: string, status: string) =>
    pollsApi.updateStatus(pollId, status),
  /** @deprecated Use addIdea instead */
  addIdeaToPoll: async (pollId: string, ideaId: string) =>
    pollsApi.addIdea(pollId, ideaId),
  /** @deprecated Use approveIdea instead */
  approveIdeaInPoll: async (pollId: string, ideaId: string, ideaCid: string) =>
    pollsApi.approveIdea(pollId, ideaId, ideaCid),
  /** @deprecated Use updateChainId instead */
  saveOnChainId: async (
    pollId: string,
    pollIdOnChain: string,
    subgraphUrl?: string
  ) => pollsApi.updateChainId(pollId, pollIdOnChain, subgraphUrl),
};
