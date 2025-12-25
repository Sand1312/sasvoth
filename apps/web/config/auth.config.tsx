import React from "react";
import Image from "next/image";

export type AuthProviderId = "google" | "github" | "wallet";

export interface AuthProviderConfig {
  id: AuthProviderId;
  name: string;
  label: string;
  icon: React.ReactNode;
  testId: string;
}

export const AUTH_PROVIDERS: AuthProviderConfig[] = [
  // TODO: Re-enable Google login when ready
  // {
  //   id: "google",
  //   name: "Google",
  //   label: "Login with Google",
  //   icon: (
  //     <Image
  //       src="/icons/google.svg"
  //       alt="Google"
  //       width={20}
  //       height={20}
  //       className="w-5 h-5"
  //     />
  //   ),
  //   testId: "google-login-btn",
  // },
  // TODO: Re-enable GitHub login when ready
  // {
  //   id: "github",
  //   name: "GitHub",
  //   label: "Login with GitHub",
  //   icon: (
  //     <Image
  //       src="/icons/github.svg"
  //       alt="GitHub"
  //       width={20}
  //       height={20}
  //       className="w-5 h-5"
  //     />
  //   ),
  //   testId: "github-login-btn",
  // },
  {
    id: "wallet",
    name: "MetaMask",
    label: "Login with MetaMask",
    icon: (
      <Image
        src="/icons/metamask.svg"
        alt="MetaMask"
        width={20}
        height={20}
        className="w-5 h-5"
      />
    ),
    testId: "wallet-login-btn",
  },
];
