import { api } from "./base";

/**
 * Results API - RESTful Resource-Oriented
 *
 * Resource: /polls/:pollId/results (poll results)
 *
 * GET    /polls/:pollId/results       - Get poll results
 * POST   /polls/:pollId/results/tally - Trigger tally calculation
 */
export const resultsApi = {
  /**
   * Get poll results
   * GET /polls/:pollId/results
   */
  getByPollId: async (pollId: string) => {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  },

  /**
   * Trigger tally calculation
   * POST /polls/:pollId/results/tally
   */
  tally: async (pollId: string) => {
    const response = await api.post(`/polls/${pollId}/results/tally`);
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getByPollId instead */
  getResults: async (params: { pollId: string }) =>
    resultsApi.getByPollId(params.pollId),
};
