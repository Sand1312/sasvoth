import { api } from "./base";

export const ipfsApi = {
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