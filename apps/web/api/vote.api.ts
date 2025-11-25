import { title } from "process";
import { api } from "./base";

export const voteApi = {
  // Lấy danh sách votes theo pollId hoặc voterId
  getVotes: async (params: { pollId?: string; voterId?: string }) => {
    const response = await api.get("/votes/get", { params });
    return response.data.votes;
  },

  // Gửi vote mới
  castVote: async (voteData: {
    voterId: string;
    pollId: string;
    selectedOption: string;
    voiceCredits: number;
    voteCommitment: string;
  }) => {
    const response = await api.post("/votes/vote", voteData);
    return response.data;
  },   

  createVoteCommitment: async (vote:string, voiceCredits:string, pollIdOnchain:string, privateKey:string) => {
    const response = await api.post("/votes/createCommitment",{ vote, voiceCredits, pollIdOnchain, privateKey });
    return response.data.voteCommitment;
  }
};