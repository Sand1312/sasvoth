"use client";
import { useRedirect } from "./useRedirect";
import { pollsApi } from "../api";
import { poll } from "ethers/lib/utils";
// import { init } from "next/dist/compiled/webpack/webpack";

export function usePolls() {
  const { goTo, replaceTo } = useRedirect();

  const initPoll = async (
    options: string[],
    startTime: Date,
    endTime: Date,
    pollIdOnChain: number
  ) => {
    try {
      const res = await pollsApi.createPoll(options, startTime, endTime, pollIdOnChain);
      goTo("/admin/dashboard");
      return res;
    } catch (error) {
      console.error("Create Poll error:", error);
      throw error;
    }
  };
  const getPolls = async (status?: string) => {
    try {
      const res = await pollsApi.getPolls(status);
      return res;
    } catch (error) {
      console.error("Get Polls error:", error);
      throw error;
    }
  };
  return {
    initPoll,
    getPolls,
  };
}
