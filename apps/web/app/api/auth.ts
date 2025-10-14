import axios from 'axios';
import {toast} from 'react-toastify';
import {ethers} from 'ethers';
// import { navigate } from 'next/navigation'; 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Gửi cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
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
export const signinWithProvider = async (provider: 'google' | 'github' | 'email' | 'wallet', data?: any) => {
  const baseUrl = `${API_BASE_URL}/auth/signin/${provider}`;

  if (provider === 'google' || provider === 'github') {
    // OAuth: Redirect GET
    window.location.href = baseUrl;
    
  } else if (provider === 'email' || provider === 'wallet') {
    // Non-OAuth: POST body
    try {
      console.log('👉 baseUrl:', baseUrl);
console.log('👉 data:', data);
      const res = await api.post(baseUrl, data);
      toast.success('Signed in!');
      // Cookies đã set từ response → Redirect dashboard manual nếu cần
      window.location.href = '/dashboard';
      return res;
    } catch (err) {
      toast.error('Signin failed');
      throw err;
    }
  }
};
export const signupWithEmail = async (email: string, password: string) => {
  try {
    const res = await api.post(`${API_BASE_URL}/auth/signup/email`, { email, password });
    toast.success('Signed up! You can login now.');
    window.location.href = '/dashboard';
    return res;
  } catch (err) {
    toast.error('Signup failed');
    throw err;
  }
}
export const signout = async () => {
  try {
    await api.post('/auth/logout');
     if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        console.warn('MetaMask revoke failed:', err);
      }
    }

    // 3️⃣ Clear frontend state
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Logged out');
    window.location.href = '/signin';
  } catch (err) {
    toast.error('Logout failed');
    throw err;
  }   
}
// Export riêng để component gọi dễ
// export const signinWithGoogle = () => signinWithProvider('google');
// export const signinWithGithub = () => signinWithProvider('github');
// export const signinWithEmail = (data: { email: string; password: string }) => signinWithProvider('email', data);
// export const signinWithWallet = (data: { address: string; signature: string; message: string }) => signinWithProvider('wallet', data);
export default api;