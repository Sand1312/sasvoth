import { api } from "./base";

export type CreateRewardPayload = {
  userAddress: string;
  pollId: string;
  creditCount: number;
};

/**
 * Rewards API - RESTful Resource-Oriented
 *
 * Resource: /users/:userAddress/rewards (user rewards)
 *
 * GET    /users/:userAddress/rewards              - Get all rewards for user
 * GET    /users/:userAddress/rewards?pollId=X     - Get reward for specific poll
 * POST   /users/:userAddress/rewards              - Create a reward
 */
export const rewardsApi = {
  /**
   * Get rewards for a user, optionally filtered by poll
   * GET /users/:userAddress/rewards or GET /users/:userAddress/rewards?pollId=X
   */
  getByUser: async (userAddress: string, pollId?: string) => {
    const params = pollId ? { pollId } : undefined;
    const response = await api.get(`/users/${userAddress}/rewards`, { params });
    return response.data;
  },

  /**
   * Create a reward
   * POST /users/:userAddress/rewards
   */
  create: async (payload: CreateRewardPayload) => {
    const response = await api.post(`/users/${payload.userAddress}/rewards`, {
      pollId: payload.pollId,
      creditCount: payload.creditCount,
    });
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getByUser instead */
  getReward: async (params: { userAddress: string; pollId: string }) =>
    rewardsApi.getByUser(params.userAddress, params.pollId),
  /** @deprecated Use create instead */
  saveReward: async (data: {
    userAddress: string;
    pollId: string;
    credit_count: number;
  }) =>
    rewardsApi.create({
      userAddress: data.userAddress,
      pollId: data.pollId,
      creditCount: data.credit_count,
    }),
};
