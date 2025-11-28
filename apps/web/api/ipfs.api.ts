import { api } from "./base";

export type IpfsUploadPayload = Record<string, unknown>;

/**
 * IPFS API - RESTful Resource-Oriented
 *
 * Resource: /ipfs (IPFS content)
 *
 * GET    /ipfs/:cid      - Get content by CID
 * POST   /ipfs           - Upload new content
 */
export const ipfsApi = {
  /**
   * Get content by CID
   * GET /ipfs/:cid
   */
  getById: async (cid: string) => {
    const response = await api.get<ArrayBuffer>(`/ipfs/${cid}`, {
      responseType: "arraybuffer",
    });

    const textDecoder = new TextDecoder();
    const jsonText = textDecoder.decode(new Uint8Array(response.data));

    try {
      return JSON.parse(jsonText);
    } catch (err) {
      console.error("Failed to parse IPFS content", err);
      return null;
    }
  },

  /**
   * Upload content to IPFS
   * POST /ipfs
   */
  create: async (content: unknown) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
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

  // Backward compatibility aliases
  /** @deprecated Use create instead */
  uploadMetadata: async (metadata: unknown) => ipfsApi.create(metadata),
  /** @deprecated Use getById instead */
  fetchMetadata: async (cid: string) => ipfsApi.getById(cid),
};
