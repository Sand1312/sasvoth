"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface FullPageLoaderProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
}

export function FullPageLoader({
  isVisible,
  title = "Connecting...",
  subtitle = "Please wait",
}: FullPageLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={title}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Spinner */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-white/70">{subtitle}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
