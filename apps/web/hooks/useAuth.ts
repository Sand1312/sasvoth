"use client";
import { useRedirect } from "./useRedirect";
import { authApi } from "../api";

export function useAuth() {
  const { goTo, replaceTo } = useRedirect();

  const signinWithProvider = async (
    provider: "google" | "github" | "email" | "wallet",
    data?: any
  ) => {
    try {
      const res = await authApi.signinWithProvider(provider, data);
      if (provider === "email" || provider === "wallet") {
        if (res?.data.user.role === "admin") {
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
      const user = await authApi.signupWithEmail(email, password);
      goTo("/dashboard");
      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };
  const signout = async () => {
    try {
      await authApi.signout();
      replaceTo("/signin");
    } catch (error) {
      console.error("Signout error:", error);
      throw error;
    }
  };
  return {
    signinWithProvider,
    signupWithEmail,
    signout,
  };
}
