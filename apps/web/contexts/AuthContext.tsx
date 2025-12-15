"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRedirect } from "../hooks/useRedirect";
import { authApi } from "../api";
import { api } from "../api/base";
import { useMaci } from "../hooks/useMACI";
import { useUser } from "../hooks/useUser";

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
  const { goTo, replaceTo } = useRedirect();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const { signupToMaci } = useMaci();
  const { saveStateIndex } = useUser();

  // On mount, if no initial user, try to refresh/fetch
  useEffect(() => {
    if (initialUser) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const refresh = async () => {
      try {
        // Validation logic similar to original useAuth
        let validated = false;
        try {
          const v = await api.post("/auth/validate");
          validated = v?.status === 200;
        } catch (_) {
          validated = false;
        }

        if (!validated) {
          try {
            await api.post("/auth/refresh");
            validated = true;
          } catch (_) {
            validated = false;
          }
        }

        if (validated) {
          try {
            const res = await api.get("/users/me");
            if (isMounted) {
              const u = (res as any)?.data ?? null;
              setUser(u);
            }
          } catch (_) {
            // ignore
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

  const handleMaciSetup = async (user: any) => {
      try {
        if (user.privateKey) {
          // New user - create MACI identity
          const maciResult = await signupToMaci(user.publicKeyX, user.publicKeyY);
  
          if (maciResult.stateIndex) {
            // Store in localStorage
            localStorage.setItem(
              "maci_stateIndex",
              maciResult.stateIndex.toString()
            );
            localStorage.setItem("maci_pubKeyX", user.publicKeyX.toString());
            localStorage.setItem("maci_pubKeyY", user.publicKeyY.toString());
  
            // Save to user profile
            await saveStateIndex(user.walletAddress!, Number(maciResult.stateIndex));
          }
        } else {
          // Existing user - restore from data
          if (user.stateIndex) {
            localStorage.setItem("maci_stateIndex", user.stateIndex.toString());
            localStorage.setItem("maci_pubKeyX", user.publicKeyX.toString());
            localStorage.setItem("maci_pubKeyY", user.publicKeyY.toString());
          }
        }
      } catch (error) {
        console.error("MACI setup error:", error);
        throw new Error("Failed to setup MACI system.");
      }
    };

  const loginWithEmail = async (identifier: string, password: string) => {
    try {
      const res = await authApi.signinWithProvider("email", {
        username: identifier,
        email: identifier,
        password,
      });

      const returnedUser = res.user;
      const newUser = returnedUser || ({ authenticated: true } as any);
      setUser(newUser);
      // Logic for redirect is handled in components now with callbackUrl
      return res;
    } catch (error) {
      console.error("Email login error:", error);
      throw error;
    }
  };

  const loginWithWallet = async () => {
     try {
          // Check if MetaMask is installed
          if (!(window as any).ethereum) {
            throw new Error("MetaMask is not installed.");
          }
    
          // Request account access
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
          const account = accounts[0];
          const message = "Sign to login with MetaMask";
    
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
            // Initialize MACI
            await handleMaciSetup(returnedUser);
          } else {
            setUser({ authenticated: true } as any);
          }
    
          // Redirect logic moved to components
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
          // goTo("/dashboard"); // Handled in component
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
          } catch (_) {
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
