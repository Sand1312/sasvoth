import { api } from "./base";

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
    return response.data as { cid: string; cidUri?: string; url: string };
  uploadMetadata: async (file: File) => {
    const form = new FormData();
    form.append("file", file, file.name);

    const response = await api.post("/ipfs", form, {
      headers: {
      },
    });

    return response.data as { cid: string };
  },
};