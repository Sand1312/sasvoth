import { userApi } from "../api/user.api";
import { createApiHook } from "./factory";

export const useUser = createApiHook({
  getUserByWallet: userApi.getUserByWallet,
  saveStateIndex: userApi.saveStateIndex,
  deposit: userApi.deposit,
  getHistoryDeposit: userApi.getHistoryDeposit,
});
