import axios, { AxiosRequestConfig } from "axios";

// Use same-origin proxy for dev to ensure cookies are set and sent correctly.
// Client will call `/api/...` on the Next.js app which will proxy to the backend.
const API_BASE_URL = "/api/v1";

// Direct backend URL for slow endpoints (skip Next.js proxy to avoid timeout)
const DIRECT_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:8000/api/v1";

// Slow endpoints that need longer timeout and direct backend call
// These operations can take several minutes (deploy contracts, generate proofs, etc.)
const SLOW_ENDPOINT_PATTERNS = [
  "/maci/deploy", // Deploy MACI contract (~2-5 min)
  "/maci/polls", // Deploy poll contract (~1-2 min)
  "/maci/tally", // Tally votes with ZK proofs (~5-30 min)
  "/maci/prove", // Generate ZK proofs (~5-30 min)
  "/maci/merge", // Merge state tree (~1-2 min)
];

const SLOW_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_TIMEOUT_MS = 30 * 1000; // 30 seconds

// Check if endpoint matches slow patterns
function isSlowEndpoint(url: string): boolean {
  return SLOW_ENDPOINT_PATTERNS.some((pattern) => url.includes(pattern));
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Direct API for slow endpoints (bypasses Next.js proxy)
export const directApi = axios.create({
  baseURL: DIRECT_BACKEND_URL,
  withCredentials: true,
  timeout: SLOW_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

// Smart API call - automatically uses direct backend for slow endpoints
export async function smartRequest<T = unknown>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const isSlow = isSlowEndpoint(url);
  const client = isSlow ? directApi : api;

  if (isSlow) {
    console.log(`[API] Using direct backend for slow endpoint: ${url}`);
  }

  const response = await client.request<T>({
    method,
    url,
    data,
    ...config,
  });

  return response.data;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const reqUrl: string = (originalRequest?.url as string) || "";
      // Avoid infinite loops: do not attempt refresh for refresh/validate calls
      const isAuthPath =
        reqUrl.includes("/auth/refresh") || reqUrl.includes("/auth/validate");
      if (isAuthPath) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        // Use the same axios instance so baseURL=/api is applied
        await api.post("/auth/refresh", {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
