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
    <PollProvider pollId={pollId}>
      <PollClient pollId={pollId} searchParams={searchParams} />
    </PollProvider>
  );
}
