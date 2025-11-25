import { api } from "./base";

export type IpfsUploadPayload = Record<string, unknown>;

export const ipfsApi = {
  uploadMetadata: async (metadata: unknown) => {
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const file = new File([blob], "metadata.json", {
      type: "application/json",
    });

    const form = new FormData();
    form.append("file", file);

    const response = await api.post("/ipfs", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const cid = (response.data as { cid: string }).cid;
    return { cid, url: `/api/v1/ipfs/${cid}` };
  },

  fetchMetadata: async (cid: string) => {
    const response = await api.get<ArrayBuffer>(`/ipfs/${cid}`, {
      responseType: "arraybuffer",
    });

    const textDecoder = new TextDecoder();
    const jsonText = textDecoder.decode(new Uint8Array(response.data));

    try {
      return JSON.parse(jsonText);
    } catch (err) {
      console.error("Failed to parse IPFS metadata", err);
      return null;
    }
  },
};
