import { resultsApi } from "@/api";

export function useResults() {
  // Lấy kết quả poll
  const getResults = async ( pollId: string ) => {
    return await resultsApi.getResults({pollId});
  };
  const tallyVotes = async (pollId: string) => {
    return await resultsApi.tally(pollId);
  };

  return {
    getResults,
    tallyVotes,
  };
}