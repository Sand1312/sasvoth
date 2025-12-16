import { api } from "./base";

export type CreateRewardPayload = {
  userId: string;
  pollId: string;
  creditCount: number;
};

/**
 * Rewards API - RESTful Resource-Oriented
 *
 * Resource: /users/:userId/rewards (user rewards)
 *
 * GET    /users/:userId/rewards              - Get all rewards for user
 * GET    /users/:userId/rewards?pollId=X     - Get reward for specific poll
 * POST   /users/:userId/rewards              - Create a reward
 */
export const rewardsApi = {
  /**
   * Get rewards for a user, optionally filtered by poll
   * GET /users/:userId/rewards or GET /users/:userId/rewards?pollId=X
   */
  getByUser: async (userId: string, pollId?: string) => {
    const params = pollId ? { pollId } : undefined;
    const response = await api.get(`/users/${userId}/rewards`, { params });
    return response.data;
  },

  /**
   * Create a reward
   * POST /users/:userId/rewards
   */
  create: async (payload: CreateRewardPayload) => {
    const response = await api.post(`/users/${payload.userId}/rewards`, {
      pollId: payload.pollId,
      creditCount: payload.creditCount,
    });
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getByUser instead */
  getReward: async (params: { userId: string; pollId: string }) =>
    rewardsApi.getByUser(params.userId, params.pollId),
  /** @deprecated Use create instead */
  saveReward: async (data: {
    userId: string;
    pollId: string;
    credit_count: number;
  }) =>
    rewardsApi.create({
      userId: data.userId,
      pollId: data.pollId,
      creditCount: data.credit_count,
    }),
};
