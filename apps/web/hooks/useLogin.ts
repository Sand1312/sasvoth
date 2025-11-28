"use client";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "./useAuth";

// Error message constants
const ERROR_MESSAGES = {
  WALLET: {
    NOT_INSTALLED: "MetaMask is not installed.",
    CONNECTION_FAILED: "Failed to connect wallet.",
    SIGNATURE_FAILED: "Failed to sign message.",
    NETWORK_ERROR: "Network error occurred.",
  },
  FORM: {
    REQUIRED_FIELDS: "Username/email and password are required.",
    INVALID_CREDENTIALS: "Invalid credentials.",
    NETWORK_ERROR: "Network error occurred.",
  },
} as const;

interface UseLoginReturn {
  // State
  walletError: string | null;
  formError: string | null;
  isSubmitting: boolean;

  // Handlers
  handleWalletLogin: () => Promise<void>;
  handleEmailLogin: (identifier: string, password: string) => Promise<void>;
  handleSocialLogin: (provider: string) => void;

  // Utilities
  clearErrors: () => void;
  reset: () => void;
}

export function useLogin(): UseLoginReturn {
  const [walletError, setWalletError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithEmail, loginWithWallet, loginWithSocial } = useAuth();

  // Wallet login handler
  const handleWalletLogin = useCallback(async (): Promise<void> => {
    setWalletError(null);
    setIsSubmitting(true);

    try {
      await loginWithWallet();
    } catch (error: any) {
      console.error("Wallet login error:", error);
      setWalletError(
        error?.response?.data?.message ||
        error?.message ||
        ERROR_MESSAGES.WALLET.CONNECTION_FAILED
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithWallet]);

  // Email login handler
  const handleEmailLogin = useCallback(
    async (identifier: string, password: string): Promise<void> => {
      setFormError(null);
      setIsSubmitting(true);

      try {
        // Validate required fields
        if (!identifier || !password) {
          setFormError(ERROR_MESSAGES.FORM.REQUIRED_FIELDS);
          return;
        }

        await loginWithEmail(identifier, password);
      } catch (error: any) {
        console.error("Email login error:", error);
        setFormError(
          error?.response?.data?.message ||
          ERROR_MESSAGES.FORM.INVALID_CREDENTIALS
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [loginWithEmail]
  );

  // Social login handler (OAuth redirects)
  const handleSocialLogin = useCallback((provider: string): void => {
    try {
      loginWithSocial(provider as "google" | "github");
    } catch (error) {
      console.error("Social login error:", error);
    }
  }, [loginWithSocial]);

  // Clear all errors
  const clearErrors = useCallback((): void => {
    setWalletError(null);
    setFormError(null);
  }, []);

  // Reset all state
  const reset = useCallback((): void => {
    setWalletError(null);
    setFormError(null);
    setIsSubmitting(false);
  }, []);

  // Memoize handlers for stable references
  const handlers = useMemo(
    () => ({
      handleWalletLogin,
      handleEmailLogin,
      handleSocialLogin,
      clearErrors,
      reset,
    }),
    [handleWalletLogin, handleEmailLogin, handleSocialLogin, clearErrors, reset]
  );

  // Memoize return value
  return useMemo(
    () => ({
      walletError,
      formError,
      isSubmitting,
      ...handlers,
    }),
    [walletError, formError, isSubmitting, handlers]
  );
}
