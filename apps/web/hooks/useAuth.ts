"use client";
import { useEffect, useState } from "react";
import { useRedirect } from "./useRedirect";
import { authApi } from "../api";
import { api } from "../api/base";
import {useMaci} from "./useMACI"
import { useUser } from "./useUser";

//TODOs: define user type
type User = any;

export function useAuth() {
  const { goTo, replaceTo } = useRedirect();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { signupToMaci } = useMaci();
  const { saveStateIndex } = useUser();

  // refresh session and load current user on mount
  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      try {
        // 1) Try to validate existing access token first (avoids 401 from refresh when no cookie)
        let validated = false;
        try {
          const v = await api.post("/auth/validate");
          validated = v?.status === 200;
        } catch (_) {
          validated = false;
        }

        // 2) If not validated, attempt refresh (will 401 if no refresh cookie)
        if (!validated) {
          try {
            await api.post("/auth/refresh");
            validated = true;
          } catch (_) {
            validated = false;
          }
        }

        // 3) If validated (either had access or refreshed), load current user
        if (validated) {
          try {
            const res = await api.get("/users/me");
            if (isMounted) {
              const u = (res as any)?.data ?? null;
              setUser(u);
              setIsLoading(false);
            }
            return;
          } catch (_) {
            // fall through to unauthenticated state
          }
        }

        // Not authenticated
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Not logged in or refresh failed:", err);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    refresh();

    return () => {
      isMounted = false;
    };
  }, []);

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
          await saveStateIndex(user.walletAddress!, maciResult.stateIndex);
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
      if (returnedUser) {
        setUser(returnedUser);
      } else {
        setUser({ authenticated: true } as any);
      }
      
      goTo("/dashboard");
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

      // Navigate to dashboard
      const targetPath =
        returnedUser?.role === "admin" ? "/admin/dashboard" : "/dashboard";
      goTo(targetPath);
      
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

  const signupWithEmail = async (
    email: string,
    password: string,
    name: string,
    walletAddress?: string
  ) => {
    try {
      const res = await authApi.signupWithEmail(
        email,
        password,
        name,
        walletAddress
      );
      const createdUser = res?.data?.user ?? res?.data ?? null;
      if (createdUser) setUser(createdUser);
      goTo("/dashboard");
      return res;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signout = async () => {
    try {
      // prefer centralized api signout if available
      try {
        await authApi.signout();
      } catch (_) {
        // fallback to raw endpoint
        await api.post("/auth/logout");
      }
      setUser(null);
      replaceTo("/signin");
    } catch (error) {
      console.error("Signout error:", error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    loginWithEmail,
    loginWithWallet,
    loginWithSocial,
    signupWithEmail,
    signout,
    setUser,
  };
}
