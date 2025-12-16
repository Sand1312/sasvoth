import { resultsApi } from "@/api";
import { createAsyncHook } from "./factory";

export const useResults = createAsyncHook(
  {
    getResults: async (pollId: string) => {
      return await resultsApi.getResults({ pollId });
    },
    tallyVotes: async (pollId: string) => {
      return await resultsApi.tally(pollId);
    },
  },
  "Results"
);
