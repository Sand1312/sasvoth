import { api } from './base';
import { toast } from 'react-toastify';

export const authApi= {
  signinWithProvider:async (provider: 'google' | 'github' | 'email' | 'wallet', data?: any) => {
    const baseUrl = `/auth/signin/${provider}`;
    if (provider === 'google' || provider === 'github') {
      // OAuth: Redirect GET
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}${baseUrl}`;
    } else if (provider === 'email' || provider === 'wallet') {

      try{
        const res = await api.post(baseUrl, data);
        toast.success('Signed in!');
        console.log('Signin response:', res);
        return res;
      } catch (err) {
        toast.error('Signin failed');
        throw err;
      }
    }
  },
  signupWithEmail: async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/signup/email', { email, password });
      toast.success('Signed up! You can login now.');
      return res.data;
    } catch (err) {
      toast.error('Signup failed');
      throw err;
    }
  },
  signout: async () => {
    try {
      await api.post('/auth/logout');
      if ((window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          });
        } catch (err) {
          console.warn('MetaMask revoke failed:', err);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Logged out');
     
    } catch (err) {
      toast.error('Logout failed');
      throw err;
    }
  }
}
