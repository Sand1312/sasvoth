"use client";
import { useRedirect } from "./useRedirect";
import { pollsApi } from "../api";
import { PollStatus } from "@/types/polls";
import { useState } from "react";
// import { init } from "next/dist/compiled/webpack/webpack";

export function usePolls() {
  const { goTo, replaceTo } = useRedirect();
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const initPoll = async (
     title: string,
    description: string,
    creatorAddress: string,
    numberOptions: number,
    startTime: Date,
    endTime: Date,
  ) => {
    try {
      const res = await pollsApi.createPoll(
        title,
        description,
        creatorAddress,
        numberOptions,
        startTime,
        endTime,
      );
      goTo("/admin/dashboard");
      return res;
    } catch (error) {
      console.error("Create Poll error:", error);
      throw error;
    }
  };
  const getPolls = async (status?: PollStatus) => {
    try {
      const res = await pollsApi.getPolls(status);
      return res;
    } catch (error) {
      console.error("Get Polls error:", error);
      throw error;
    }
  };
  const getPollById = async (pollId: string) => {
    try {
      const res = await pollsApi.getPollById(pollId);
      return res;
    } catch (error) {
      console.error("Get Poll By ID error:", error);
      throw error;
    }
  };

  const updatePollStatus= pollsApi.updatePollStatus;
   const addIdeaToPoll= pollsApi.addIdeaToPoll;
   const approveIdeaInPoll= pollsApi.approveIdeaInPoll;
   const saveOnChainId= pollsApi.saveOnChainId;


  return {
    initPoll,
    getPolls,
    getPollById,
    updatePollStatus ,
    addIdeaToPoll,
    approveIdeaInPoll,
    saveOnChainId,
    selectedPollId,
    setSelectedPollId,
  };
}
