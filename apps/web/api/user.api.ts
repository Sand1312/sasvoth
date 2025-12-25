import { api } from "./base";

/**
 * Users API - RESTful Resource-Oriented
 *
 * Resource: /users
 * Sub-resource: /users/:id/wallet
 * Sub-resource: /users/:id/state-index
 * Sub-resource: /users/:id/deposits
 * Sub-resource: /users/:id/profile
 *
 * GET    /users              - List all users
 * GET    /users/:id          - Get a specific user
 * GET    /users/me           - Get current user
 * PATCH  /users/:id          - Update a user
 * DELETE /users/:id          - Delete a user
 * POST   /users/:id/wallet   - Connect wallet to user
 * PATCH  /users/:id/state-index - Update MACI state index
 * GET    /users/:id/deposits - Get deposit history
 * POST   /users/:id/deposits - Create a deposit
 * PATCH  /users/:id/profile  - Update user profile (avatar, DOB)
 */
export const userApi = {
  /**
   * Get current authenticated user
   * GET /users/me
   */
  getMe: async () => {
    const response = await api.get("/users/me");
    return response.data?.user ?? response.data;
  },

  /**
   * Get a user by ID or wallet address
   * GET /users/:id
   */
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data?.user ?? response.data;
  },

  /**
   * Update a user
   * PATCH /users/:id
   */
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data?.user ?? response.data;
  },

  /**
   * Connect wallet to user
   * POST /users/:id/wallet
   */
  connectWallet: async (userId: string, walletAddress: string) => {
    const response = await api.post(`/users/${userId}/wallet`, {
      walletAddress,
    });
    return response.data;
  },

  /**
   * Update MACI state index
   * PATCH /users/:id/state-index
   */
  updateStateIndex: async (userId: string, stateIndex: number) => {
    const response = await api.patch(`/users/${userId}/state-index`, {
      stateIndex,
    });
    return response.data?.user ?? response.data;
  },

  /**
   * Get deposit history
   * GET /users/:id/deposits
   */
  getDeposits: async (userId: string) => {
    const response = await api.get(`/users/${userId}/deposits`);
    return response.data?.deposits ?? response.data?.history ?? response.data;
  },

  /**
   * Create a deposit
   * POST /users/:id/deposits
   */
  createDeposit: async (userId: string, amount: number, txHash: string) => {
    const response = await api.post(`/users/${userId}/deposits`, {
      amount,
      txHash,
    });
    return response.data?.user ?? response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use getById instead */
  getUserByWallet: async (walletAddress: string) =>
    userApi.getById(walletAddress),
  /** @deprecated Use updateStateIndex instead */
  saveStateIndex: async (walletAddress: string, stateIndex: number) =>
    userApi.updateStateIndex(walletAddress, stateIndex),
  /** @deprecated Use createDeposit instead */
  deposit: async (userId: string, amountToken: number, txHash: string) =>
    userApi.createDeposit(userId, amountToken, txHash),
  /** @deprecated Use getDeposits instead */
  getHistoryDeposit: async (userId: string) => userApi.getDeposits(userId),

  /**
   * Update user profile (avatar, date of birth)
   * PATCH /users/:id/profile
   */
  updateProfile: async (
    userId: string,
    data: { avatar?: string; dateOfBirth?: string },
  ) => {
    const response = await api.patch(`/users/${userId}/profile`, data);
    return response.data?.user ?? response.data;
  },
};
