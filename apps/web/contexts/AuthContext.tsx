"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRedirect } from "../hooks/useRedirect";
import { authApi } from "../api";
import { api } from "../api/base";

type User = any; // Todo: Define precise User type

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
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
    }
  };

  const loginWithWallet = async () => {
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
    } catch (error) {
      console.error("Wallet login error:", error);
      throw error;
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
    }
  };

  const signout = async () => {
    try {
      try {
        await authApi.signout();
      } catch {
        // Fallback or ignore if already signed out
        await api.post("/auth/logout");
      }
      setUser(null);
      replaceTo("/signin");
    } catch (error) {
      console.error("Signout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
