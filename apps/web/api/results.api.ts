import { title } from "process";
import { api } from "./base";

export const resultsApi = {
  getResults: async (params: { pollId: string; }) => {
    const response = await api.get(`/results/${params.pollId}`,);
    return response.data;
  },
  tally:async (pollId: string) => {
    const response = await api.post("/results/tally", { pollId });
    return response.data;
  }
};