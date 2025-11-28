import { api } from "./base";

export type DeployPollPayload = {
  startDate: number;
  endDate: number;
  voteOptions?: number;
};

/**
 * MACI API - RESTful Resource-Oriented
 *
 * Resource: /maci/polls (MACI polls on-chain)
 * Sub-resource: /maci/polls/:id/contracts
 * Sub-resource: /maci/polls/:id/merge
 * Sub-resource: /maci/polls/:id/proofs
 *
 * POST   /maci/polls                    - Deploy a new poll
 * GET    /maci/polls/:id/contracts      - Get poll contracts
 * POST   /maci/polls/:id/merge          - Merge poll state
 * POST   /maci/polls/:id/merge/direct   - Direct merge state
 * POST   /maci/polls/:id/proofs         - Generate proofs
 * POST   /maci/polls/:id/proofs/submit  - Submit proofs
 */
export const maciApi = {
  /**
   * Deploy a new MACI poll
   * POST /maci/polls
   */
  createPoll: async (payload: DeployPollPayload) => {
    const response = await api.post("/maci/polls", payload);
    return response.data;
  },

  /**
   * Get poll contracts
   * GET /maci/polls/:id/contracts
   */
  getContracts: async (pollId: string) => {
    const response = await api.get(`/maci/polls/${pollId}/contracts`);
    return response.data;
  },

  /**
   * Merge poll state
   * POST /maci/polls/:id/merge
   */
  merge: async (pollId: string) => {
    const response = await api.post(`/maci/polls/${pollId}/merge`);
    return response.data;
  },

  /**
   * Direct merge state
   * POST /maci/polls/:id/merge/direct
   */
  mergeDirect: async (pollId: string) => {
    const response = await api.post(`/maci/polls/${pollId}/merge/direct`);
    return response.data;
  },

  /**
   * Generate proofs
   * POST /maci/polls/:id/proofs
   */
  generateProofs: async (pollId: string) => {
    const response = await api.post(`/maci/polls/${pollId}/proofs`);
    return response.data;
  },

  /**
   * Submit proofs
   * POST /maci/polls/:id/proofs/submit
   */
  submitProofs: async (pollId: string) => {
    const response = await api.post(`/maci/polls/${pollId}/proofs/submit`);
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use createPoll instead */
  deployPoll: async (body: DeployPollPayload) => maciApi.createPoll(body),
  /** @deprecated Use merge instead */
  mergePoll: async (pollId: string) => maciApi.merge(pollId),
  /** @deprecated Use mergeDirect instead */
  mergeStateDirect: async (pollId: string) => maciApi.mergeDirect(pollId),
  /** @deprecated Use getContracts instead */
  getPollContracts: async (pollId: string) => maciApi.getContracts(pollId),
};
