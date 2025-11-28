"use client";

import * as React from "react";
import { SocialLoginButton } from "./SocialLoginButton";

export interface SocialLoginButtonsProps {
  onGoogleLogin: () => void;
  onGithubLogin: () => void;
  onWalletLogin: () => void;
  error: string | null;
}

import { AUTH_PROVIDERS } from "../config/auth.config";

export function SocialLoginButtons({
  onGoogleLogin,
  onGithubLogin,
  onWalletLogin,
  error,
}: SocialLoginButtonsProps): React.ReactElement {
  const handleLogin = (providerId: string) => {
    switch (providerId) {
      case "google":
        onGoogleLogin();
        break;
      case "github":
        onGithubLogin();
        break;
      case "wallet":
        onWalletLogin();
        break;
    }
  };

  return (
    <div role="group" aria-label="Social login options">
      <div className="space-y-2">
        {AUTH_PROVIDERS.map((provider) => (
          <SocialLoginButton
            key={provider.id}
            provider={provider.id}
            onClick={() => handleLogin(provider.id)}
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
