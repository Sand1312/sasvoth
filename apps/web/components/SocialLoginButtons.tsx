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

  const handleSocialLogin = async (providerId: string) => {
    try {
      console.log(`Login with ${providerId}`);
      // Mapping providerId string to literal type
      if (providerId === "google" || providerId === "github") {
         console.log("Triggering social login for:", providerId);
         loginWithSocial(providerId);
         // showSuccess("Redirecting", `Connecting to ${providerId}...`); // Removed to avoid blocking redirect
      } else if (providerId === "wallet") {
          console.log("Triggering wallet login");
          showSuccess("Connecting Wallet", "Please check your MetaMask...");
          await loginWithWallet();
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
