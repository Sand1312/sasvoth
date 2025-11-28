import { rewardsApi } from "../api/rewards.api";
import { createAsyncHook } from "./factory";

export const useRewards = createAsyncHook(
  {
    getReward: async (userId: string, pollId: string) => {
      return await rewardsApi.getReward({ userId, pollId });
    },
    saveReward: async (
      userId: string,
      pollId: string,
      credit_count: number
    ) => {
      return await rewardsApi.saveReward({ userId, pollId, credit_count });
    },
  },
  "Rewards"
);
