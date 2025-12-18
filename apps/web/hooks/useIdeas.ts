"use client";
import { ideasApi } from "../api";
import { createApiHook } from "./factory";

export const useIdeas = createApiHook(
  {
    createIdea: ideasApi.createIdea,
    getIdeaById: ideasApi.getIdeaById,
    updateIdeaCID: ideasApi.updateIdeaCID,
    updateIdea: ideasApi.updateIdea,
    getByUserAddress: ideasApi.getByUserAddress,
  },
  { includeRedirect: true }
);
