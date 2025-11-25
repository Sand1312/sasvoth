import { api } from "./base";

export type IpfsUploadPayload = Record<string, unknown>;

export const ipfsApi = {
  uploadMetadata: async (payload: IpfsUploadPayload) => {
    const metadataBlob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });

    const form = new FormData();
    form.append("file", metadataBlob, "metadata.json");

    const response = await api.post("/ipfs", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("IPFS upload response:", response.data);
    return response.data as { cid: string; cidUri?: string; url: string };
  },
};
