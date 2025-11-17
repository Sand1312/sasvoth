"use client";

import { useEffect } from "react";

let workerStarted = false;

export function MockProvider() {
  useEffect(() => {
    const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

    if (!mockingEnabled || workerStarted) {
      return;
    }

    workerStarted = true;

    import("../mocks/browser")
      .then(({ worker }) =>
        worker.start({
          serviceWorker: {
            url: "/mockServiceWorker.js",
          },
          onUnhandledRequest: "bypass",
        })
      )
      .catch((error) => {
        console.error("Failed to start MSW worker", error);
      });
  }, []);

  return null;
}
