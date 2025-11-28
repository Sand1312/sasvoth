"use client";

import * as React from "react";
import { Button } from "@sasvoth/ui/button";
import { cn } from "@sasvoth/ui/lib/utils";

export interface SocialLoginButtonProps {
  provider: "google" | "github" | "wallet";
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  testId: string;
  isLoading?: boolean;
}

export const SocialLoginButton = React.memo(
  ({
    onClick,
    label,
    icon,
    testId,
    isLoading = false,
  }: SocialLoginButtonProps): React.ReactElement => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <div className="relative">
        <Button
          type="button"
          onClick={onClick}
          disabled={isLoading}
          data-testid={testId}
          aria-label={label}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 border rounded hover:bg-gray-100 transition h-12",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            icon
          )}
        </Button>
        {isHovered && !isLoading && (
          <span
            className="absolute left-full ml-3 px-3 py-1 bg-gray-800 text-white text-xs rounded shadow z-10 whitespace-nowrap pointer-events-none"
            role="tooltip"
          >
            {label}
          </span>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
      prevProps.provider === nextProps.provider &&
      prevProps.label === nextProps.label &&
      prevProps.isLoading === nextProps.isLoading
    );
  }
);

SocialLoginButton.displayName = "SocialLoginButton";
