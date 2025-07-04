"use client";

// TODO: use client can be remove?

import { useState } from "react";
import MswInitializer from "@/components/MswInitializer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  return (
    <html lang="en">
      <body>
        {!ready && process.env.NODE_ENV === "development" && (
          <MswInitializer onReady={() => setReady(true)} />
        )}
        {ready && children}
      </body>
    </html>
  );
}
