"use client";

import * as React from "react";
import { SocialLoginButton } from "./SocialLoginButton";
import { useFeedback } from "@/contexts/FeedbackContext";

export interface SocialLoginButtonsProps {
  error: string | null;
}

import { AUTH_PROVIDERS } from "../config/auth.config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

export function SocialLoginButtons({
  error,
}: SocialLoginButtonsProps): React.ReactElement {
  /* Removed duplicate useFeedback call */
  const { showSuccess, showError } = useFeedback();
  const { loginWithSocial, loginWithWallet } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("from") || "/dashboard";

  // Import authStore for lock check - use reactive state
  const [isLocked, setIsLocked] = React.useState(false);
  
  React.useEffect(() => {
    const { useAuthStore } = require("@/stores/authStore");
    // Subscribe to lock state changes
    const unsubscribe = useAuthStore.subscribe(
      (state: any) => state.pendingOperation,
      (pending: any) => setIsLocked(!!pending)
    );
    // Set initial value
    setIsLocked(useAuthStore.getState().isLocked());
    return unsubscribe;
  }, []);

  const handleSocialLogin = async (providerId: string) => {
    // ACID: Silently block duplicate clicks when already processing
    if (isLocked) {
      console.log("[Auth] Blocked duplicate click - operation in progress");
      return; // Silent return, no error dialog
    }

    try {
      console.log(`Login with ${providerId}`);
      // Mapping providerId string to literal type
      if (providerId === "google" || providerId === "github") {
         console.log("Triggering social login for:", providerId);
         loginWithSocial(providerId);
         // showSuccess("Redirecting", `Connecting to ${providerId}...`); // Removed to avoid blocking redirect
      } else if (providerId === "wallet") {
          console.log("Triggering wallet login");
          const result = await loginWithWallet();
          
          // Handle graceful returns (no error dialog needed)
          if (result?.reason === "in_progress") {
            // Already processing in this tab - silently ignore
            return;
          }
          if (result?.reason === "pending_other_tab") {
            // MetaMask has pending request in another tab - show helpful message
            showSuccess("Check MetaMask", "A wallet request is already pending. Please check your MetaMask popup.");
            return;
          }
          if (result?.reason === "user_rejected") {
            // User closed MetaMask - no error needed
            return;
          }
          
          // Success!
          showSuccess("Connected", "Wallet login successful!");
          router.push(callbackUrl);
      } else {
         console.warn(`Unsupported provider: ${providerId}`);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      showError("Connection Failed", err.message || "Could not connect to provider");
    }
  };

  return (
    <div role="group" aria-label="Social login options">
      <div className="space-y-2">
        {AUTH_PROVIDERS.map((provider) => (
          <SocialLoginButton
            key={provider.id}
            provider={provider.id}
            onClick={() => handleSocialLogin(provider.id)}
            label={provider.label}
            icon={provider.icon}
            testId={provider.testId}
            isLoading={isLocked && provider.id === "wallet"}
          />
        ))}
      </div>
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 mt-2"
        >
          {error}
        </p>
      )}
    </div>
  );
}
