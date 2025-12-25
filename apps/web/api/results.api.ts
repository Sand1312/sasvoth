import { api } from "./base";

/**
 * Results API - RESTful Resource-Oriented
 *
 * Resource: /polls/:pollId/results (poll results)
 *
 * GET    /polls/:pollId/results             - Get poll results
 * POST   /polls/:pollId/results/tally       - Start async tally calculation
 * GET    /polls/:pollId/results/tally-status - Check tally progress
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
   * Start async tally calculation
   * POST /polls/:pollId/results/tally
   * Returns immediately with status: 'started' | 'already_counting' | 'already_complete'
   */
  tally: async (pollId: string) => {
    const response = await api.post(`/polls/${pollId}/results/tally`);
    return response.data;
  },

  /**
   * Check tally progress
   * GET /polls/:pollId/results/tally-status
   */
  getTallyStatus: async (pollId: string) => {
    const response = await api.get(`/polls/${pollId}/results/tally-status`);
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getByPollId instead */
  getResults: async (params: { pollId: string }) =>
    resultsApi.getByPollId(params.pollId),
};
