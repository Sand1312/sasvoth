"use client";

import { useEffect } from "react";
import { Button } from "@sasvoth/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4 py-10 text-black">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-gray-500">{error.message}</p>
        <Button onClick={() => reset()} className="rounded-full border border-black px-6 py-2 hover:bg-black/5">
          Try again
        </Button>
      </div>
    </main>
  );
}
