import { api } from "./base";

export type IdeaPayload = {
  title: string;
  description: string;
  descriptionMore?: string[];
  imgSrc: string;
  imgsSrc?: string[];
  creatorIdea: string;
};

export const ideasApi = {
  createIdea: async (payload: IdeaPayload) => {
    const response = await api.post("/ideas", payload);
    return response.data;
  },
  getIdeaById: async (ideaId: string) => {
    const response = await api.get(`/ideas/${ideaId}`);
    return response.data;
  },
  updateIdeaCID: async (ideaId: string, idea_cid: string) => {
    const response = await api.patch("/ideas/update-cid", { ideaId, idea_cid });
    return response.data;
  },
  updateIdea: async (ideaId: string, updateData: Partial<IdeaPayload>) => {
    const response = await api.put(`/ideas/${ideaId}`, updateData);
    return response.data;
  },
};
