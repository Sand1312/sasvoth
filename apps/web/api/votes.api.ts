import { title } from "process";
import { api } from "./base";

export const votesApi = {
  // Lấy danh sách votes theo pollId hoặc voterId
  getVotes: async (params: { pollId?: string; }) => {
    const response = await api.get("/votes/", { params });
    return response.data.votes;
  },

  // Gửi vote mới
  castVote: async (voteData: {
    pollId: string;
    selectedOption: number;
    voiceCredits: number;
  }) => {
    console.log('Casting vote with data:', voteData);
    const response = await api.post("/votes/", voteData);
    return response.data;
  },   

 
};