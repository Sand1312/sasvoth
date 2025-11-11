"use client";
import { useEffect, useState } from "react";
import { useRedirect } from "./useRedirect";
import { authApi } from "../api";
import { api } from "../api/base";

//TODOs: define user type
type User = any;

export function useAuth() {
  const { goTo, replaceTo } = useRedirect();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const signinWithProvider = async (
    provider: "google" | "github" | "email" | "wallet",
    data?: any
  ) => {
    try {
      const res = await authApi.signinWithProvider(provider, data);
      console.log("signinWithProvider response:", res);

      // if sign in returned user info, set it locally
      const returnedUser = res?.data?.user ?? res?.data ?? null;
      console.log("Extracted user:", returnedUser);

      if (returnedUser) {
        setUser(returnedUser);
      } else if (res && (provider === "email" || provider === "wallet")) {
        // even if no explicit user data, if signin succeeded, treat as authenticated
        console.log("Signin succeeded, navigating to dashboard");
        setUser({ authenticated: true } as any);
      }

      // navigate based on provider and user role
      if (provider === "email" || provider === "wallet") {
        const role = returnedUser?.role;
        const targetPath = role === "admin" ? "/admin/dashboard" : "/dashboard";
        console.log("About to navigate to:", targetPath);
        try {
          goTo(targetPath);
          console.log("Navigation called successfully");
        } catch (navError) {
          console.error("Navigation failed:", navError);
        }
      }

      return res;
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string) => {
    try {
      const res = await authApi.signupWithEmail(email, password);
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
    signinWithProvider,
    signupWithEmail,
    signout,
  };
}
