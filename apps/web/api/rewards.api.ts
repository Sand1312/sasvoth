import { api } from "./base";

export const rewardsApi = {
    getReward: async (params: { userId: string; pollId: string }) => {
        const response = await api.get("/rewards/get", { params });
        return response.data;
    },
    saveReward: async (data: { userId: string; pollId: string; credit_count: number }) => {
        const response = await api.post("/rewards/save", data);
        return response.data;
    }
};




    