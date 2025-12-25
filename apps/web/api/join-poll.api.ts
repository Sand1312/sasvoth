import { api } from "./base";

export type JoinPollPayload = {
  voterAdrress: string;  // Note: Backend schema has typo "voterAdrress"
  pollId: string;
  pollIdOnchain: string;
  voteCommitment: string;
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
   * GET /join-poll/get?pollId=X&voterAdrress=Y
   */
  getAll: async (pollId: string, voterAddress?: string) => {
    const params: Record<string, string> = { pollId };
    if (voterAddress) params.voterAdrress = voterAddress; // Note: backend has typo "voterAdrress"
    const response = await api.get(`/join-poll/get`, { params });
    return response.data?.votes ?? response.data;
  },

  /**
   * Join a poll (create participant)
   * POST /join-poll/join
   */
  create: async (payload: JoinPollPayload) => {
    const response = await api.post(`/join-poll/join`, {
      voterAdrress: payload.voterAdrress, // Backend has typo
      pollId: payload.pollId,
      pollIdOnchain: payload.pollIdOnchain,
      voteCommitment: payload.voteCommitment,
    });
    return response.data;
  },

  /**
   * Check if user has joined a poll
   * GET /join-poll/check?pollId=X&voterAdrress=Y
   */
  checkJoined: async (pollId: string, voterAddress: string) => {
    const response = await api.get(`/join-poll/check`, {
      params: { pollId, voterAdrress: voterAddress } // Note: backend has typo "voterAdrress"
    });
    return response.data?.hasVoted ?? false;
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
  // /** @deprecated Use pollParticipantsApi.getAll instead */
  getVotes: async (params: { pollId?: string; voterId?: string }) =>
    params.pollId
      ? pollParticipantsApi.getAll(params.pollId, params.voterId)
      : [],
  // /** @deprecated Use pollParticipantsApi.create instead */
  joinPoll: async (voteData: JoinPollPayload) =>
    pollParticipantsApi.create(voteData),
  // /** @deprecated Use pollParticipantsApi.createCommitment instead */
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
  // /** @deprecated Use pollParticipantsApi.checkJoined instead */
  checkVote: async (voterId: string, pollId: string) =>
    pollParticipantsApi.checkJoined(pollId, voterId),
};
