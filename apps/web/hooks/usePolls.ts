"use client";
import { useRedirect } from "./useRedirect";
import { pollsApi } from "../api";
import { PollStatus } from "@/types/polls";
import { useState } from "react";
import { createDataHook } from "./factory";

// Factory-created hooks
export const usePollsQuery = createDataHook(
  (status?: PollStatus) => ["polls", status || "all"],
  (status?: PollStatus) => pollsApi.getPolls(status),
  { staleTime: 1000 * 60 * 5 }, // 5 minutes
);

export const usePollQuery = createDataHook(
  (pollId: string) => ["poll", pollId],
  (pollId: string) => pollsApi.getPollById(pollId),
  { staleTime: 1000 * 60 * 5 },
);

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
    maciConfig?: {
      mode?: number;
      messageBatchSize?: number;
      pollStateTreeDepth?: number;
      voteOptionTreeDepth?: number;
      tallyProcessingStateTreeDepth?: number;
      initialVoiceCredits?: number;
    },
  ) => {
    try {
      const res = await pollsApi.createPoll(
        title,
        description,
        creatorAddress,
        numberOptions,
        startTime,
        endTime,
        maciConfig,
      );
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

  const updatePollStatus = pollsApi.updatePollStatus;
  const addIdeaToPoll = pollsApi.addIdeaToPoll;
  const approveIdeaInPoll = pollsApi.approveIdeaInPoll;
  const saveOnChainId = pollsApi.saveOnChainId;

  /**
   * Get polls with pagination and filtering (server-side)
   */
  const getPollsPaginated = async (options: {
    page?: number;
    limit?: number;
    status?: string;
    activeAt?: Date;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "startTime" | "title";
    sortOrder?: "asc" | "desc";
  }) => {
    try {
      const res = await pollsApi.getPollsPaginated(options);
      return res;
    } catch (error) {
      console.error("Get Polls Paginated error:", error);
      throw error;
    }
  };

  return {
    initPoll,
    getPolls,
    getPollById,
    getPollsPaginated,
    updatePollStatus,
    addIdeaToPoll,
    approveIdeaInPoll,
    saveOnChainId,
    selectedPollId,
    setSelectedPollId,
  };
}
