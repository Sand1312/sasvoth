import {userApi} from "../api/user.api";

export function useUser() {
  // Get user by wallet address
  const getUserByWallet = async (walletAddress: string) => {
    return await userApi.getUserByWallet(walletAddress);
  };

  const saveStateIndex = async (walletAddress: string, stateIndex: number) => {
    return await userApi.saveStateIndex(walletAddress, stateIndex);
  }
  const deposit = async (userId: string, amountToken: number, txHash: string) => {
    return await userApi.deposit(userId, amountToken, txHash);
  }
  const getHistoryDeposit = async (userId: string) => {
    return await userApi.getHistoryDeposit(userId);
  }

  return {
    saveStateIndex,
    deposit,
    getHistoryDeposit,
  }
}