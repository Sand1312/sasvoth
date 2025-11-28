import { api } from "./base";

export type JoinPollPayload = {
  voterId: string;
  pollId: string;
  voteCommitment: string;
  pollIdOnchain: number;
};

export type VoteCommitmentPayload = {
  vote: string;
  voiceCredits: string;
  pollIdOnchain: string;
  privateKey: string;
};

/**
 * Poll Participants API - RESTful Resource-Oriented
 *
 * Resource: /polls/:pollId/participants (poll participants/joiners)
 * Sub-resource: /vote-commitments (vote commitment generation)
 *
 * GET    /polls/:pollId/participants           - List participants
 * POST   /polls/:pollId/participants           - Join a poll
 * GET    /polls/:pollId/participants/:voterId  - Check if user joined
 * POST   /vote-commitments                     - Generate vote commitment
 */
export const pollParticipantsApi = {
  /**
   * Get all participants for a poll
   * GET /polls/:pollId/participants
   */
  getAll: async (pollId: string, voterId?: string) => {
    const params = voterId ? { voterId } : undefined;
    const response = await api.get(`/polls/${pollId}/participants`, { params });
    return response.data?.participants ?? response.data?.votes ?? response.data;
  },

  /**
   * Join a poll (create participant)
   * POST /polls/:pollId/participants
   */
  create: async (payload: JoinPollPayload) => {
    const response = await api.post(`/polls/${payload.pollId}/participants`, {
      voterId: payload.voterId,
      voteCommitment: payload.voteCommitment,
      pollIdOnchain: payload.pollIdOnchain,
    });
    return response.data;
  },

  /**
   * Check if user has joined a poll
   * GET /polls/:pollId/participants/:voterId
   */
  checkJoined: async (pollId: string, voterId: string) => {
    const response = await api.get(`/polls/${pollId}/participants/${voterId}`);
    return response.data?.hasJoined ?? response.data?.hasVoted ?? false;
  },

  /**
   * Generate vote commitment
   * POST /vote-commitments
   */
  createCommitment: async (payload: VoteCommitmentPayload) => {
    const response = await api.post("/vote-commitments", payload);
    return response.data;
  },
};

// Backward compatibility - export as joinPollApi
export const joinPollApi = {
  /** @deprecated Use pollParticipantsApi.getAll instead */
  getVotes: async (params: { pollId?: string; voterId?: string }) =>
    params.pollId
      ? pollParticipantsApi.getAll(params.pollId, params.voterId)
      : [],
  /** @deprecated Use pollParticipantsApi.create instead */
  joinPoll: async (voteData: JoinPollPayload) =>
    pollParticipantsApi.create(voteData),
  /** @deprecated Use pollParticipantsApi.createCommitment instead */
  createVoteCommitment: async (
    vote: string,
    voiceCredits: string,
    pollIdOnchain: string,
    privateKey: string
  ) =>
    pollParticipantsApi.createCommitment({
      vote,
      voiceCredits,
      pollIdOnchain,
      privateKey,
    }),
  /** @deprecated Use pollParticipantsApi.checkJoined instead */
  checkVote: async (voterId: string, pollId: string) =>
    pollParticipantsApi.checkJoined(pollId, voterId),
};
