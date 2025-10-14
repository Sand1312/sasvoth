import axios from 'axios';
import {toast} from 'react-toastify';
import { useRouter } from 'next/router';
// import { navigate } from 'next/navigation'; 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Gửi cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
const navigate = useRouter().push;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Gọi refresh endpoint - backend sẽ set new cookies
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
        // toast.success("Session refreshed. Retrying...");
        // Retry original request với new access_token (trong cookies)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed -> redirect login
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    // toast.error(error.response?.data?.message || 'An error occurred');
    return Promise.reject(error);
  },

);
export const signinWithGoogle =  () => {
  const googleUrl = `${API_BASE_URL}/auth/google`;
  console.log('Redirecting to Google:', googleUrl); // DEBUG: Check console browser nếu undefined
  navigate( `${process.env.NEXT_PUBLIC_API_URL}/auth/google`);
};

export const signinWithGithub = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
};
export default api;