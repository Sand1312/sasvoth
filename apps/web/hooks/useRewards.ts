import { rewardsApi } from "../api/rewards.api";
import { createAsyncHook } from "./factory";

export const useRewards = createAsyncHook(
  {
    getReward: async (userAddress: string, pollId: string) => {
      return await rewardsApi.getReward({ userAddress, pollId });
    },
    saveReward: async (
      userAddress: string,
      pollId: string,
      credit_count: number
    ) => {
      return await rewardsApi.saveReward({ userAddress, pollId, credit_count });
    },
  },
  "Rewards"
);
