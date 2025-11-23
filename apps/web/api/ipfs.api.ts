import { api } from "./base";

export type IpfsUploadPayload = Record<string, unknown>;

export const ipfsApi = {
  uploadMetadata: async (payload: IpfsUploadPayload) => {
    const response = await api.post("/ipfs", payload);
    return response.data as { cid: string; url: string };
  },
};
