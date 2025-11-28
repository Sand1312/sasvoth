"use client";

import * as React from "react";
import { useLogin } from "../hooks/useLogin";
import { LoginForm } from "./LoginForm";
import { SocialLoginButtons } from "./SocialLoginButtons";

export default function LoginPage(): React.ReactElement {
  const {
    walletError,
    formError,
    isSubmitting,
    handleWalletLogin,
    handleEmailLogin,
    handleSocialLogin,
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>

        {/* Sign up link */}
        <div className="text-center mb-4 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="underline text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign up
          </a>
        </div>

        {/* Email/Password Login Form */}
        <LoginForm
          onSubmit={handleEmailLogin}
          isSubmitting={isSubmitting}
          error={formError}
        />

        {/* Divider with "or" text */}
        <div className="my-6 flex items-center">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>

        {/* Social Login Buttons */}
        <SocialLoginButtons
          onGoogleLogin={() => handleSocialLogin("google")}
          onGithubLogin={() => handleSocialLogin("github")}
          onWalletLogin={handleWalletLogin}
          error={walletError}
        />
      </div>
    </div>
  );
}
