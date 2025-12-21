import { api } from "./base";

export type DeployMaciPayload = {
  chain: string;
  sessionKeyAddress: string;
  config: {
    policy: {
      policyType: string;
      checkerType: string;
    };
    MACI: {
      policy: string;
      stateTreeDepth: number;
      modes: number[];
    };
    VerifyingKeysRegistry: {
      args: {
        stateTreeDepth: number;
        intStateTreeDepth: number;
        pollStateTreeDepth: number;
        tallyProcessingStateTreeDepth: number;
        voteOptionTreeDepth: number;
        messageBatchSize: number;
      };
    };
  };
};

export type DeployPollPayload = {
  chain: string;
  maciAddress?: string;
  sessionKeyAddress: string;
  config: {
    startDate: number;
    endDate: number;
    mode: number;
    tallyProcessingStateTreeDepth: number;
    messageBatchSize: number;
    pollStateTreeDepth: number;
    voteOptionTreeDepth: number;
    policy: {
      policyType: string;
      checkerType: string;
    };
    initialVoiceCreditsProxy: {
      factoryType: string;
      type: string;
      args: { amount: string };
    };
    voteOptions: number | string;
  };
};

/**
 * MACI API - RESTful Resource-Oriented
 *
 * Resource: /maci (MACI contract management)
 * Resource: /maci/polls (MACI polls on-chain)
 *
 * POST   /maci/deploy                   - Deploy MACI contract
 * POST   /maci/polls                    - Deploy a new poll
 * GET    /maci/polls/:id/contracts      - Get poll contracts
 * POST   /maci/polls/:id/merge          - Merge poll state
 * POST   /maci/polls/:id/merge/direct   - Direct merge state
 * POST   /maci/polls/:id/proofs         - Generate proofs
 * POST   /maci/polls/:id/proofs         - Generate proofs
 * POST   /maci/polls/:id/proofs/submit  - Submit proofs
 * POST   /maci/signup                   - Signup to MACI
 * POST   /maci/polls/:id/join           - Join poll
 * POST   /maci/polls/:id/vote           - Vote
 */
export const maciApi = {
  /**
   * Signup to MACI (Legacy - direct signup)
   * POST /maci/signup
   */
  signup: async (payload: { maciPubKey: string; maciAddress?: string; sgData?: string }) => {
    const response = await api.post("/maci/signup", payload);
    return response.data;
  },

  /**
   * Signup to MACI with EIP-712 signature (New - secure)
   * POST /maci/signup-eip712
   * 
   * The backend verifies user eligibility and relays to Gatekeeper contract
   */
  signupWithSignature: async (payload: {
    maciAddress?: string;
    pubKeyX: string;
    pubKeyY: string;
    signature: string;
    nonce: number;
    deadline: number;
  }) => {
    const response = await api.post("/maci/signup-eip712", payload);
    return response.data;
  },

  /**
   * Get nonce for a user (for EIP-712 signing)
   * GET /maci/nonce/:address
   */
  getNonce: async (address: string) => {
    const response = await api.get(`/maci/nonce/${address}`);
    return response.data;
  },

  /**
   * Get latest MACI deployment info
   * GET /maci/deployments/latest
   * 
   * TODO: Dùng để lấy maciAddress và startBlock từ backend
   * - Thay thế localStorage.getItem("maciAddress")
   * - Thay thế localStorage.getItem("maciStartBlock")
   * - Sử dụng trong: useMaciJoinPoll, votes/[id]/page.tsx
   */
  getLatestDeployment: async (): Promise<{
    maciAddress: string;
    startBlock: number;
    subgraphUrl: string;
    chain: string;
  }> => {
    const response = await api.get("/maci/deployments/latest");
    return response.data;
  },

  /**
   * Get MACI deployment by address
   * GET /maci/deployments/:address
   * 
   * TODO: Dùng khi có maciAddress cụ thể từ poll.maciAddress
   * - Query thông tin MACI contract cụ thể
   * - Hữu ích khi có nhiều MACI deployments khác nhau
   */
  getDeploymentByAddress: async (maciAddress: string): Promise<{
    maciAddress: string;
    startBlock: number;
    subgraphUrl: string;
    chain: string;
  }> => {
    const response = await api.get(`/maci/deployments/${maciAddress}`);
    return response.data;
  },

  /**
   * Join Poll
   * POST /maci/polls/:id/join
   */
  joinPoll: async (pollId: string, payload: { maciPrivateKey: string; maciAddress?: string; startBlock?: number }) => {
    const response = await api.post(`/maci/polls/${pollId}/join`, payload);
    return response.data;
  },

  /**
   * Vote
   * POST /maci/polls/:id/vote
   */
  vote: async (pollId: string, payload: {
    voteOptionIndex: number;
    voteWeight: number;
    nonce: number;
    userStateIndex: string;
    userMaciPrivateKey: string;
    userMaciPublicKey: string;
    maciAddress?: string
  }) => {
    const response = await api.post(`/maci/polls/${pollId}/vote`, payload);
    return response.data;
  },

  /**
   * Deploy new MACI Contract
   * POST /maci/deploy
   */
  deployMaci: async (payload: DeployMaciPayload) => {
    // Note: The backend endpoint might be /deploy/maci or /maci/deploy depending on implementation.
    // Spec says: POST /v1/deploy/maci. We are using base.ts which prefixes /api/v1.
    // So if backend serves /api/v1/deploy/maci, we use /deploy/maci.
    // Let's assume /deploy/maci based on spec "POST /v1/deploy/maci" relative to base.
    // UPDATE: Backend Controller MaciController maps to 'maci', so endpoint is 'maci/deploy'.
    const response = await api.post("/maci/deploy", payload);
    return response.data;
  },

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
  getContracts: async (pollId: string, maciAddress?: string) => {
    const response = await api.get(`/maci/polls/${pollId}/contracts`, {
      params: { maciAddress }
    });
    return response.data;
  },

  /**
   * Merge poll state
   * POST /maci/polls/:id/merge
   */
  merge: async (pollId: string, maciAddress?: string) => {
    const response = await api.post(`/maci/polls/${pollId}/merge`, { maciAddress });
    return response.data;
  },

  /**
   * Direct merge state
   * POST /maci/polls/:id/merge/direct
   */
  mergeDirect: async (pollId: string, maciAddress?: string) => {
    const response = await api.post(`/maci/polls/${pollId}/merge/direct`, { maciAddress });
    return response.data;
  },

  /**
   * Generate proofs
   * POST /maci/polls/:id/proofs
   */
  generateProofs: async (pollId: string, maciAddress?: string, startBlock?: number) => {
    const response = await api.post(`/maci/polls/${pollId}/proofs`, { maciAddress, startBlock });
    return response.data;
  },

  /**
   * Submit proofs
   * POST /maci/polls/:id/proofs/submit
   */
  submitProofs: async (pollId: string, maciAddress?: string) => {
    const response = await api.post(`/maci/polls/${pollId}/proofs/submit`, { maciAddress });
    return response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use createPoll instead */
  deployPoll: async (body: any) => maciApi.createPoll(body),
  /** @deprecated Use merge instead */
  mergePoll: async (pollId: string, maciAddress?: string) => maciApi.merge(pollId, maciAddress),
  /** @deprecated Use mergeDirect instead */
  mergeStateDirect: async (pollId: string, maciAddress?: string) => maciApi.mergeDirect(pollId, maciAddress),
  /** @deprecated Use getContracts instead */
  getPollContracts: async (pollId: string, maciAddress?: string) => maciApi.getContracts(pollId, maciAddress),
};
