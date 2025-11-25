"use client";
import { useRedirect } from "./useRedirect";
import { ipfsApi } from "../api";

export function useIPFS() {
  const { goTo, replaceTo } = useRedirect();

  const uploadMetadata = ipfsApi.uploadMetadata;
  const fetchMetadata = ipfsApi.fetchMetadata;

  return {
    uploadMetadata,
    fetchMetadata,
    goTo,
    replaceTo,
  };
}
