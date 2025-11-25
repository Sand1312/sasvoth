import { title } from "process";
import { api } from "./base";
import { PollStatus } from "@/types/polls";

export const pollsApi = {
  createPoll: async (
    title: string,
    description: string,
    creatorAddress: string,
    numberOptions: number,
    startTime: Date,
    endTime: Date,
  ) => {
    try {
      const pollData = {
        title: title,
        description: description,
        creatorAddress: creatorAddress,
        status: PollStatus.Prepare,
        startTime: startTime,
        endTime: endTime,
        numberOptions: numberOptions,
      };
      const response = await api.post("/polls/create", pollData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPolls: async (status?: PollStatus) => {
    try {
      let response;
      if (status) {
        response = await api.get(`/polls/status/${status}`);
      } else {
        response = await api.get("/polls");
      }
      const polls = Array.isArray(response.data?.polls)
        ? response.data.polls
        : Array.isArray(response.data)
          ? response.data
          : [];

      return polls.map((poll: Record<string, unknown>) => ({
        ...poll,
        _id:
          (poll as { _id?: string })._id ||
          (poll as { id?: string }).id ||
          (poll as { pollId?: string | number }).pollId ||
          (
            poll as { pollIdOnChain?: string | number }
          ).pollIdOnChain?.toString(),
      }));
    } catch (error) {
      throw error;
    }
  },
  getPollById: async (pollId: string) => {
    try {
      const response = await api.get(`/polls/${pollId}`);
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePollStatus: async (pollId: string, status: string) => {
    try {
      const response = await api.patch(`/polls/updateStatus`, { pollId, status });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  addIdeaToPoll: async (pollId: string, ideaId: string) => {
    try {
      const response = await api.patch(`/polls/addIdea`, {pollId, ideaId });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  approveIdeaInPoll: async (pollId: string, ideaId: string, ideaCid: string) => {
    try {
      const response = await api.patch(`/polls/approveIdea`, {pollId,ideaId, ideaCid });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  saveOnChainId: async (pollId: string, pollIdOnChain: string) => {
    try {
      const response = await api.patch(`/polls/saveOnChain`, {
        pollId,
        pollIdOnChain,
      });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
};
