import { api } from "./base";

export type CreateVotePayload = {
  voterId: string;
  pollId: string;
  selectedOption: number;
  voiceCredits: number;
  voteCommitment: string;
  message?: any;
  encPubKey?: any;
  maciContractAddress?: string;
  userId?: string; 
};

/**
 * Votes API - RESTful Resource-Oriented
 *
 * Resource: /votes
 *
 * GET    /votes          - List all votes (with optional filters)
 * POST   /votes          - Create a new vote (cast vote)
 * GET    /votes/:id      - Get a specific vote
 * DELETE /votes/:id      - Delete a vote (if allowed)
 */
export const votesApi = {
  /**
   * Get all votes, optionally filtered by pollId
   * GET /votes or GET /votes?pollId=X
   */
  getAll: async (params?: { pollId?: string }) => {
    const response = await api.get("/votes", { params });
    return response.data?.votes ?? response.data;
  },

  /**
   * Create a new vote (cast vote)
   * POST /votes
   */
  create: async (payload: CreateVotePayload) => {
    const response = await api.post("/votes", payload);
    return response.data;
  },

  /**
   * Get a specific vote by ID
   * GET /votes/:id
   */
  getById: async (id: string) => {
    const response = await api.get(`/votes/${id}`);
    return response.data?.vote ?? response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getAll instead */
  getVotes: async (params: { pollId?: string }) => votesApi.getAll(params),
  /** @deprecated Use create instead */
  castVote: async (voteData: CreateVotePayload) => votesApi.create(voteData),
};
