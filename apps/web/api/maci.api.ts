import { api } from "./base";

export const maciApi = {
  deployPoll: async (body: { startDate: number; endDate: number; voteOptions?: number }) => {
    const res = await api.post("/maci/deploy-poll", body);
    return res.data;
  },
  mergePoll: async (pollId: string) => {
    const res = await api.post(`/maci/merge/${pollId}`);
    return res.data;
  },
  mergeStateDirect: async (pollId: string) => {
    const res = await api.post(`/maci/merge-direct/${pollId}`);
    return res.data;
  },
  generateProofs: async (pollId: string) => {
    const res = await api.post(`/maci/generate-proofs/${pollId}`);
    return res.data;
  },
  submitProofs: async (pollId: string) => {
    const res = await api.post(`/maci/submit-proofs/${pollId}`);
    return res.data;
  },
  getPollContracts: async (pollId: string) => {
    const res = await api.get(`/maci/poll-contracts/${pollId}`);
    return res.data;
  },
};