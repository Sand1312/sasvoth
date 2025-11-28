import { joinPollApi } from "@/api/join-poll.api";
import { createApiHook } from "./factory";

export const useJoinPoll = createApiHook({
  get: joinPollApi.getVotes,
  joinPoll: joinPollApi.joinPoll,
  createVoteCommitment: joinPollApi.createVoteCommitment,
  check: joinPollApi.checkVote,
});
