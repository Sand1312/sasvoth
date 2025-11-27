import { useCallback } from "react";
import { votesApi } from "@/api/votes.api";

export function useVote() {
  // Lấy danh sách votes
  const getVotes = async (params: { pollId?: string }) => {
    return await votesApi.getVotes(params);
  };

  // Gửi vote mới
  const castVote =  async (voteData: {
   pollId: string;
    selectedOption: number;
    voiceCredits: number;
  }) => {
    return await votesApi.castVote(voteData);
  };

  return {
    getVotes,
    castVote,

  };
}