import { api } from "./base";
import { PollStatus } from "@/types/polls";

export const pollsApi = {
  createPoll: async (
    options: string[],
    startTime: Date,
    endTime: Date,
    pollIdOnChain: number
  ) => {
    try {
      const pollData = {
        title: "New Poll",
        description: "Description of the poll",
        creatorAddress: "0x9adc62ed1627ffe15e94806380782d6fe630c992",
        status: PollStatus.Prepare,
        startTime: startTime,
        endTime: endTime,
        options: options,
        pollIdOnChain: pollIdOnChain,
      };
      const response = await api.post("/v1/polls", pollData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPolls: async (status?: PollStatus) => {
    try {
      const response = await api.get("/v1/polls", {
        params: status ? { status } : undefined,
      });
      const polls = Array.isArray(response.data?.polls)
        ? response.data.polls
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
      const response = await api.get(`/v1/polls/${pollId}`);
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePollStatus: async (pollId: string, status: string) => {
    try {
      const response = await api.patch(`/v1/polls/${pollId}/status`, { status });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  addIdeaToPoll: async (pollId: string, ideaId: string) => {
    try {
      const response = await api.patch(`/v1/polls/${pollId}/ideas`, { ideaId });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
  approveIdeaInPoll: async (pollId: string, ideaId: string) => {
    try {
      const response = await api.patch(`/v1/polls/${pollId}/approve`, { ideaId });
      return response.data?.poll ?? response.data;
    } catch (error) {
      throw error;
    }
  },
};
