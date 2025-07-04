"use client";

import { useEffect } from "react";

export default function MswInitializer({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      fetch("/api/health-check")
        .then((res) => {
          const isMockActive = res.headers.get("x-mock-active") === "true";

          if (isMockActive) {
            return import("@/mock/browser").then(({ worker }) => {
              return worker.start({
                onUnhandledRequest: "bypass",
              });
            });
          }
        })
        .then(() => {
          console.log("[MSW] worker started via middleware signal");
          onReady();
        })
        .catch((err) => {
          console.warn("[MSW] failed to start or not enabled", err);
          onReady();
        });
    } else {
      onReady();
    }
  }, [onReady]);

  return null;
}
