"use client";
import { ipfsApi } from "../api";
import { createApiHook } from "./factory";

export const useIPFS = createApiHook(
  {
    uploadMetadata: ipfsApi.uploadMetadata,
    fetchMetadata: ipfsApi.fetchMetadata,
  },
  { includeRedirect: true }
);
