import { api } from "./base";
import { toast } from "react-toastify";

/**
 * Auth API - RESTful Resource-Oriented
 *
 * Resource: /auth/sessions (authentication sessions)
 * Resource: /auth/users (user registration)
 *
 * POST /auth/sessions - Create session (login)
 * DELETE /auth/sessions - Delete session (logout)
 * POST /auth/users - Create user (signup)
 */
export const authApi = {
  /**
   * Create a new authentication session (login)
   * POST /auth/sessions
   */
  createSession: async (
    provider: "google" | "github" | "email" | "wallet",
    credentials?: any
  ) => {
    // OAuth providers redirect to external auth
    if (provider === "google" || provider === "github") {
      window.location.href = `/api/v1/auth/sessions?provider=${provider}`;
      return;
    }

    // Email/wallet authentication
    if (provider === "email" || provider === "wallet") {
      try {
        const res = await api.post(
          `/auth/sessions`,
          { provider, ...credentials },
          { withCredentials: true }
        );
        toast.success("Signed in!");
        return res.data;
      } catch (err: any) {
        console.error("Session creation failed:", err.response?.data || err);
        toast.error(err.response?.data?.message || "Sign in failed");
        throw err;
      }
    }

    return undefined;
  },

  /**
   * Delete current authentication session (logout)
   * DELETE /auth/sessions
   */
  deleteSession: async () => {
    try {
      await api.delete("/auth/sessions", { withCredentials: true });

      // Revoke MetaMask permissions if available
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
      console.error("Session deletion failed:", err.response?.data || err);
      toast.error("Logout failed");
      throw err;
    }
  },

  /**
   * Create a new user account (signup)
   * POST /auth/users
   */
  createUser: async (userData: {
    email: string;
    password: string;
    name: string;
    walletAddress?: string;
  }) => {
    try {
      const res = await api.post("/auth/users", userData, {
        withCredentials: true,
      });
      toast.success("Account created! You can login now.");
      return res.data;
    } catch (err: any) {
      console.error("User creation failed:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Signup failed");
      throw err;
    }
  },

  // Backward compatibility aliases
  /** @deprecated Use createSession instead */
  signinWithProvider: async (
    provider: "google" | "github" | "email" | "wallet",
    data?: any
  ) => authApi.createSession(provider, data),

  /** @deprecated Use createUser instead */
  signupWithEmail: async (
    email: string,
    password: string,
    name: string,
    walletAddress?: string
  ) => authApi.createUser({ email, password, name, walletAddress }),

  /** @deprecated Use deleteSession instead */
  signout: async () => authApi.deleteSession(),
};
