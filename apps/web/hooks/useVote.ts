import { useCallback } from "react";
import { voteApi } from "@/api/vote.api";

export function useVote() {
  // Lấy danh sách votes
  const getVotes = async (params: { pollId?: string; voterId?: string }) => {
    return await voteApi.getVotes(params);
  };

  // Gửi vote mới
  const castVote =  async (voteData: {
    voterId: string;
    pollId: string;
    selectedOption: string;
    voiceCredits: number;
    privateKey: string;
    voteCommitment: string;
  }) => {
    return await voteApi.castVote(voteData);
  };

  const createVoteCommitment = async (vote: string, voiceCredits: string, pollIdOnchain: string, privateKey: string) => {
    return await voteApi.createVoteCommitment(vote, voiceCredits, pollIdOnchain, privateKey);
  };

  return {
    getVotes,
    castVote,
    createVoteCommitment,
  };
}