import { api } from "./base";
import { toast } from "react-toastify";

export const authApi = {
  signinWithProvider: async (
    provider: "google" | "github" | "email" | "wallet",
    data?: any
  ) => {
    if (provider === "google" || provider === "github") {
      window.location.href = `/api/auth/signin?type=${provider}`;
      return;
    }

    // email / wallet signin
    if (provider === "email" || provider === "wallet") {
      try {
        const res = await api.post(`/auth/signin?type=${provider}`, data, {
          withCredentials: true,
        });
        toast.success("Signed in!");
        console.log("Signin response:", res.data);
        return res.data;
      } catch (err: any) {
        console.error("Signin failed:", err.response?.data || err);
        toast.error(err.response?.data?.message || "Signin failed");
        throw err;
      }
    }

    return undefined;
  },

  signupWithEmail: async (email: string, password: string) => {
    try {
      const res = await api.post(
        "/auth/signup?type=email",
        { email, password },
        { withCredentials: true }
      );
      toast.success("Signed up! You can login now.");
      console.log("Signup response:", res.data);
      return res.data;
    } catch (err: any) {
      console.error("Signup failed:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Signup failed");
      throw err;
    }
  },

  signout: async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      // optional: revoke MetaMask permissions
      if ((window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (err) {
          console.warn("MetaMask revoke failed:", err);
        }
      }
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Logged out");
    } catch (err: any) {
      console.error("Logout failed:", err.response?.data || err);
      toast.error("Logout failed");
      throw err;
    }
  },
};
