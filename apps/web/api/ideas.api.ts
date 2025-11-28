import { api } from "./base";

export type IdeaPayload = {
  title: string;
  description: string;
  descriptionMore?: string[];
  imgSrc: string;
  imgsSrc?: string[];
  creatorIdea: string;
};

/**
 * Ideas API - RESTful Resource-Oriented
 *
 * Resource: /ideas
 *
 * GET    /ideas          - List all ideas
 * POST   /ideas          - Create a new idea
 * GET    /ideas/:id      - Get a specific idea
 * PUT    /ideas/:id      - Replace an idea
 * PATCH  /ideas/:id      - Update an idea partially
 * DELETE /ideas/:id      - Delete an idea
 * PATCH  /ideas/:id/cid  - Update idea's CID (sub-resource)
 */
export const ideasApi = {
  /**
   * Get all ideas
   * GET /ideas
   */
  getAll: async () => {
    const response = await api.get("/ideas");
    return response.data?.ideas ?? response.data;
  },

  /**
   * Create a new idea
   * POST /ideas
   */
  create: async (payload: IdeaPayload) => {
    const response = await api.post("/ideas", payload);
    return response.data?.idea ?? response.data;
  },

  /**
   * Get a specific idea by ID
   * GET /ideas/:id
   */
  getById: async (id: string) => {
    const response = await api.get(`/ideas/${id}`);
    return response.data?.idea ?? response.data;
  },

  /**
   * Update an idea partially
   * PATCH /ideas/:id
   */
  update: async (id: string, data: Partial<IdeaPayload>) => {
    const response = await api.patch(`/ideas/${id}`, data);
    return response.data?.idea ?? response.data;
  },

  /**
   * Delete an idea
   * DELETE /ideas/:id
   */
  delete: async (id: string) => {
    const response = await api.delete(`/ideas/${id}`);
    return response.data;
  },

  /**
   * Update idea's CID (sub-resource)
   * PATCH /ideas/:id/cid
   */
  updateCid: async (id: string, cid: string) => {
    const response = await api.patch(`/ideas/${id}/cid`, { cid });
    return response.data?.idea ?? response.data;
  },

  // Backward compatibility aliases
  /** @deprecated Use create instead */
  createIdea: async (payload: IdeaPayload) => ideasApi.create(payload),
  /** @deprecated Use getById instead */
  getIdeaById: async (ideaId: string) => ideasApi.getById(ideaId),
  /** @deprecated Use updateCid instead */
  updateIdeaCID: async (ideaId: string, idea_cid: string) =>
    ideasApi.updateCid(ideaId, idea_cid),
  /** @deprecated Use update instead */
  updateIdea: async (ideaId: string, updateData: Partial<IdeaPayload>) =>
    ideasApi.update(ideaId, updateData),
};
