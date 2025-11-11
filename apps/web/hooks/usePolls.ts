"use client";
import { useRedirect } from "./useRedirect";
import { pollsApi } from "../api";
// import { init } from "next/dist/compiled/webpack/webpack";

export function usePolls() {
  const { goTo, replaceTo } = useRedirect();

  const initPoll = async (
    options: string[],
    startTime: Date,
    endTime: Date
  ) => {
    try {
      const res = await pollsApi.createPoll(options, startTime, endTime);
      goTo("/admin/dashboard");
      return res;
    } catch (error) {
      console.error("Create Poll error:", error);
      throw error;
    }
  };
  const getPollsByType = async () => {
    try {
      const res = await pollsApi.getPollsByType();
      return res;
    } catch (error) {
      console.error("Get Polls error:", error);
      throw error;
    }
  };
  return {
    initPoll,
    getPollsByType,
  };
}
