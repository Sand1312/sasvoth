import {userApi} from "../api/user.api";

export function useUser() {
  // Get user by wallet address
  const getUserByWallet = async (walletAddress: string) => {
    return await userApi.getUserByWallet(walletAddress);
  };

  const saveStateIndex = async (walletAddress: string, stateIndex: number) => {
    return await userApi.saveStateIndex(walletAddress, stateIndex);
  }
  return {
    saveStateIndex,
  }
}