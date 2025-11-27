import { useCallback } from "react";
import { joinPollApi } from "@/api/join-poll.api";

export function useJoinPoll() {
  // Lấy danh sách votes
  const get = async (params: { pollId?: string; voterId?: string }) => {
    return await joinPollApi.getVotes(params);
  };

  // Gửi vote mới
  const joinPoll =  async (voteData: {
    voterId: string;
    pollId: string;
    voteCommitment: string;
    pollIdOnchain: number;
  }) => {
    return await joinPollApi.joinPoll(voteData);
  };

  const createVoteCommitment = async (vote: string, voiceCredits: string, pollIdOnchain: string, privateKey: string) => {
    return await joinPollApi.createVoteCommitment(vote, voiceCredits, pollIdOnchain, privateKey);
  };

  const check = async (voterId: string, pollId: string) => {
    return await joinPollApi.checkVote(voterId, pollId);
  };

  return {
    get,
    joinPoll,
    createVoteCommitment,
    check,
  };
}