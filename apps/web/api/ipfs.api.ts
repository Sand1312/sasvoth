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

    const response = await fetch("/api/v1/ipfs", {
      method: "POST",
      body: form,
      // fetch automatically sets Content-Type to multipart/form-data with boundary
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
    }

    const data = await response.json();
    const cid = data.cid;
    return { cid, url: `/api/v1/ipfs/${cid}` };
  },

  // Backward compatibility aliases
  /** @deprecated Use create instead */
  uploadMetadata: async (metadata: unknown) => ipfsApi.create(metadata),
  /** @deprecated Use getById instead */
  fetchMetadata: async (cid: string) => ipfsApi.getById(cid),

  /**
   * Upload raw file to IPFS
   * POST /ipfs
   */
  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch("/api/v1/ipfs", {
      method: "POST",
      body: form,
      // fetch automatically sets Content-Type to multipart/form-data with boundary
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
    }

    const data = await response.json();
    const cid = data.cid;
    
    return { cid, url: `/api/v1/ipfs/${cid}` };
  },
};
