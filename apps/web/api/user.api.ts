import { api } from "./base";

export const userApi = {
  // Get user by wallet address
  getUserByWallet: async (walletAddress: string) => {
    const response = await api.get(`/users/${walletAddress}`);
    return response.data.user;
  },

  saveStateIndex: async (walletAddress: string, stateIndex: number) => {
    const response = await api.patch("/users/stateIndex", { walletAddress, stateIndex });
    return response.data.user;
  },
    // Connect wallet to user
    connectWallet: async (userId: string, walletAddress: string) => {
      const response = await api.post("/users/connectWallet", { userId, walletAddress });
      return response.data;
    }
}