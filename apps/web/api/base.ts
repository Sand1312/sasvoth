import axios from "axios";

// Use same-origin proxy for dev to ensure cookies are set and sent correctly.
// Client will call `/api/...` on the Next.js app which will proxy to the backend.
const API_BASE_URL = "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  }
);

export default api;
