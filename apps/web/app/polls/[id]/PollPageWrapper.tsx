"use client";

import { PollProvider } from "./PollContext";
import PollClient from "./PollClient";

export function PollPageWrapper({
  pollId,
  searchParams,
}: {
  pollId: string;
  searchParams?: { phase?: string };
}) {
  return (
    <PollProvider>
      <PollClient searchParams={searchParams} />
    </PollProvider>
  );
}
