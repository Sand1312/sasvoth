"use client";
import { useRedirect } from "./useRedirect";
import { ideasApi } from "../api";

export function useIdeas() {
  const { goTo, replaceTo } = useRedirect();

  const createIdea = ideasApi.createIdea;
  const getIdeaById = ideasApi.getIdeaById;
  const updateIdeaCID = ideasApi.updateIdeaCID;
  const updateIdea = ideasApi.updateIdea;

  return {
    createIdea,
    getIdeaById,
    updateIdeaCID,
    updateIdea,
    goTo,
    replaceTo,
  };
}