import { resultsApi } from "@/api";
import { createAsyncHook } from "./factory";

export const useResults = createAsyncHook(
  {
    getResults: async (pollId: string) => {
      return await resultsApi.getResults({ pollId });
    },
    /**
     * Start async tally process
     * Returns immediately with status: 'started' | 'already_counting' | 'already_complete'
     */
    tallyVotes: async (pollId: string) => {
      return await resultsApi.tally(pollId);
    },
    /**
     * Check tally progress
     * Returns status: 'not_started' | 'counting' | 'completed' | 'error'
     */
    getTallyStatus: async (pollId: string) => {
      return await resultsApi.getTallyStatus(pollId);
    },
  },
  "Results"
);
