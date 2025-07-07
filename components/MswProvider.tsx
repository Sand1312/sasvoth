"use client";

import { useState } from "react";
import MswInitializer from "@/components/MswInitializer";

export default function MswProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  return (
    <>
      {!ready && process.env.NODE_ENV === "development" && (
        <MswInitializer onReady={() => setReady(true)} />
      )}
      {ready && children}
    </>
  );
}
