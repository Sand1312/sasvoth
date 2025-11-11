"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRedirect } from "./useRedirect";
import { authApi } from "../api";

// allow sending cookies cross-domain
axios.defaults.withCredentials = true;

const API_BASE = process?.env?.NEXT_PUBLIC_API_URL || "http://localhost:4000";
axios.defaults.baseURL = API_BASE;

//TODOs: define user type
type User = any;

export function useAuth() {
  const { goTo, replaceTo } = useRedirect();
  const [user, setUser] = useState<User | null>(null);

  // refresh session and load current user on mount
  useEffect(() => {
    const refresh = async () => {
      try {
        await axios.post("/auth/refresh");
        const res = await axios.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Not logged in", err);
        setUser(null);
      }
    };
    refresh();
  }, []);

  const signinWithProvider = async (
    provider: "google" | "github" | "email" | "wallet",
    data?: any
  ) => {
    try {
      const res = await authApi.signinWithProvider(provider, data);
      // if sign in returned user info, set it locally
      const returnedUser = res?.data?.user ?? res?.data ?? null;
      if (returnedUser) setUser(returnedUser);

      if (provider === "email" || provider === "wallet") {
        if (returnedUser?.role === "admin") {
          goTo("admin/dashboard");
        } else {
          goTo("/dashboard");
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
        await axios.post("/auth/logout");
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
    signinWithProvider,
    signupWithEmail,
    signout,
  };
}
