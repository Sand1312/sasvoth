import { votesApi } from "@/api/votes.api";
import { createApiHook } from "./factory";

export const useVote = createApiHook({
  getVotes: votesApi.getVotes,
  castVote: votesApi.castVote,
});
