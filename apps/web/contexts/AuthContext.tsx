"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRedirect } from "../hooks/useRedirect";
import { authApi } from "../api";
import { api } from "../api/base";
import { useAuthStore } from "../stores/authStore";

type User = any; // Todo: Define precise User type

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConnectingWallet: boolean;
  setUser: (user: User | null) => void;
  loginWithEmail: (identifier: string, password: string) => Promise<any>;
  loginWithWallet: () => Promise<any>;
  loginWithSocial: (provider: "google" | "github") => void;
  signupWithEmail: (email: string, password: string, name: string, walletAddress?: string) => Promise<any>;
  signout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser?: User | null }) {
  const { replaceTo } = useRedirect();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  // On mount, if no initial user, try to refresh/fetch
  useEffect(() => {
    if (initialUser) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const refresh = async () => {
      try {
        // 1. Try to validate existing session
        let validated = false;
        try {
          const v = await api.post("/auth/validate");
          validated = v?.status === 200;
        } catch {
          validated = false;
        }

        // 2. If invalid, try to refresh token
        if (!validated) {
          try {
            await api.post("/auth/refresh");
            validated = true;
          } catch {
            validated = false;
          }
        }

        // 3. If validated, fetch user profile
        if (validated) {
          const res = await api.get("/users/me");
          if (isMounted) {
            setUser((res as any)?.data ?? null);
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error("Auth refresh failed:", err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    refresh();
    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const loginWithEmail = async (identifier: string, password: string) => {
    const { acquireLock, releaseLock } = useAuthStore.getState();
    const acquired = acquireLock("login-email");
    if (!acquired) {
      throw new Error("Another auth operation is in progress");
    }

    try {
      const res = await authApi.signinWithProvider("email", {
        username: identifier,
        email: identifier,
        password,
      });

      const returnedUser = res.user || ({ authenticated: true } as any);
      setUser(returnedUser);
      return res;
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    } finally {
      releaseLock();
    }
  };

  const loginWithWallet = async () => {
    const { acquireLock, releaseLock } = useAuthStore.getState();
    const acquired = acquireLock("login-wallet");
    if (!acquired) {
      // Silently return if already processing in this tab
      console.log("[Auth] Wallet login blocked - operation in progress");
      return { success: false, reason: "in_progress" };
    }

    setIsConnectingWallet(true);
    try {
      if (!(window as any).ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      // Generate random nonce
      const nonce = crypto.randomUUID();
      const message = `Sign to login. Nonce: ${nonce}`;

      // Request signature
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });

      // Authenticate with backend
      const res = await authApi.signinWithProvider("wallet", {
        address: account,
        signature,
        message,
      });

      const returnedUser = res.user;
      if (returnedUser) {
        setUser(returnedUser);
      } else {
        setUser({ authenticated: true } as any);
      }

      return res;
    } catch (error: any) {
      console.error("Wallet login error:", error);
      
      // Handle MetaMask-specific errors gracefully
      const errorMessage = error?.message?.toLowerCase() || "";
      const errorCode = error?.code;
      
      // MetaMask: Already pending request (from another tab)
      if (errorMessage.includes("already pending") || errorMessage.includes("requestpermissions")) {
        console.log("[Auth] MetaMask has pending request in another tab");
        return { success: false, reason: "pending_other_tab" };
      }
      
      // MetaMask: User rejected request
      if (errorCode === 4001 || errorMessage.includes("user rejected") || errorMessage.includes("user denied")) {
        console.log("[Auth] User rejected wallet connection");
        return { success: false, reason: "user_rejected" };
      }
      
      // Other errors - still throw for error dialog
      throw error;
    } finally {
      releaseLock();
      setIsConnectingWallet(false);
    }
  };

  const loginWithSocial = (provider: "google" | "github") => {
    try {
      authApi.signinWithProvider(provider);
    } catch (error) {
      console.error("Social login error:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string, walletAddress?: string) => {
    const { acquireLock, releaseLock } = useAuthStore.getState();
    const acquired = acquireLock("signup");
    if (!acquired) {
      throw new Error("Another auth operation is in progress");
    }

    try {
      const res = await authApi.signupWithEmail(
        email,
        password,
        name,
        walletAddress
      );
      const createdUser = res?.data?.user ?? res?.data ?? null;
      if (createdUser) setUser(createdUser);
      return res;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      releaseLock();
    }
  };

  const signout = async () => {
    const { acquireLock, releaseLock } = useAuthStore.getState();
    const acquired = acquireLock("logout");
    if (!acquired) {
      throw new Error("Another auth operation is in progress");
    }

    try {
      try {
        await authApi.signout();
      } catch {
        // Fallback or ignore if already signed out
        await api.post("/auth/logout");
      }

      // Clear MACI keypair cache from memory
      try {
        const { clearMaciKeyCache } = await import("../utils/maciKeyDerivation");
        clearMaciKeyCache();
        console.log("MACI key cache cleared");
      } catch (e) {
        console.warn("Failed to clear MACI key cache:", e);
      }

      setUser(null);
      replaceTo("/signin");
    } catch (error) {
      console.error("Signout error:", error);
      throw error;
    } finally {
      releaseLock();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConnectingWallet,
        setUser,
        loginWithEmail,
        loginWithWallet,
        loginWithSocial,
        signupWithEmail,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
