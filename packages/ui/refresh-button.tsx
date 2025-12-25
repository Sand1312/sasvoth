"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "./lib/utils";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
}

function RefreshButton({
  onClick,
  loading = false,
  className,
  variant = "default",
  size = "icon",
}: RefreshButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={loading}
      className={cn(
        "rounded-full",
        variant === "default" &&
          "border border-black bg-black text-white hover:bg-black/90",
        variant === "outline" &&
          "border border-black/20 bg-white text-black hover:bg-black hover:text-white",
        size === "icon" && "w-8 h-8 p-0",
        size === "sm" && "w-8 h-8 p-0",
        size === "lg" && "w-10 h-10 p-0",
        className,
      )}
      aria-label="Refresh"
    >
      <RefreshCw
        className={cn(
          "w-4 h-4",
          size === "lg" && "w-5 h-5",
          loading && "animate-spin",
        )}
      />
    </Button>
  );
}

export { RefreshButton };
