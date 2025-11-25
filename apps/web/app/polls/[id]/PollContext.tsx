"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useParams } from "next/navigation";

type PollContextValue = { pollId: string };

const PollContext = createContext<PollContextValue | null>(null);

export function PollProvider({ children }: { children: ReactNode }) {
const { id } = useParams();
console.log("PollProvider id:", id);

  if (!id) {
    throw new Error("Poll id is not available in the route params");
  }

  const pollId = Array.isArray(id) ? String(id[0]) : String(id);

  return (
    <PollContext.Provider value={{ pollId }}>
      {children}
    </PollContext.Provider>
  );
}

export function usePollContext() {
  const context = useContext(PollContext);

  if (!context) {
    throw new Error("usePollContext must be used within a PollProvider");
  }

  return context;
}

