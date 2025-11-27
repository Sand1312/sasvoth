import { title } from "process";
import { api } from "./base";

export const joinPollApi = {
  // Lấy danh sách votes theo pollId hoặc voterId
  getVotes: async (params: { pollId?: string; voterId?: string }) => {
    const response = await api.get("/join-poll/get", { params });
    return response.data.votes;
  },

  // Gửi vote mới
  joinPoll: async (voteData: {
    voterId: string;
    pollId: string;
    voteCommitment: string;
    pollIdOnchain: number;
  }) => {
    const response = await api.post("/join-poll/join", voteData);
    return response.data;
  },   

  createVoteCommitment: async (vote:string, voiceCredits:string, pollIdOnchain:string, privateKey:string) => {
    const response = await api.post("/join-poll/createVoteCommitment",{ vote, voiceCredits, pollIdOnchain, privateKey });
    return response.data;
  },

  checkVote: async (voterId: string, pollId: string) => {
    const response = await api.get("/join-poll/check", { params: { voterId, pollId } });
    return response.data.hasVoted;
  }
};