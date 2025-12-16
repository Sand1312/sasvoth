import { api } from "./base";

export type JoinPollPayload = {
  voterId: string;
  pollId: string;
  voteCommitment: string;
  pollIdOnchain: number;
  pubKey?: { x: string; y: string };
  maciContractAddress?: string;
};

export type VoteCommitmentPayload = {
  vote: string;
  voiceCredits: string;
  pollIdOnchain: string;
  privateKey: string;
};

/**
 * Poll Participants API - RESTful Resource-Oriented
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
   * POST /join-poll/join
   */
  create: async (payload: JoinPollPayload) => {
    const response = await api.post(`/join-poll/join`, {
      voterId: payload.voterId,
      pollId: payload.pollId, 
      maciContractAddress: payload.maciContractAddress,
      pubKey: payload.pubKey,
      pollIdOnchain: payload.pollIdOnchain,
      voteCommitment: payload.voteCommitment,
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
