import { Suspense } from "react";
import { PollHero } from "./components/poll-hero";
import { PollViewFactory } from "./components/view-factory";
import { getPollById, PollData } from "@/lib/polls/service";
import { PollStatus } from "@/types/polls";
import { Skeleton } from "@sasvoth/ui/skeleton";

// Next.js 16 PPR (Partial Prerendering)
export const experimental_ppr = true;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch lightweight metadata for Hero immediately
  // This allows the hero to render instantly while the factory resolves
  // Note: getPollById fetches everything, but in a real app query would be split.
  // We use the same fetch here, Next.js request deduping (tags) handles efficiency
  // if we call it again inside Factory (though we pass pollId to factory to force Suspense boundary there).

  const pollMeta = await getPollById(id);

  const badge =
    pollMeta.status === PollStatus.Prepare
      ? pollMeta.onChainId !== "0"
        ? "Waiting for Start"
        : "Ideas in review"
      : pollMeta.status === PollStatus.Waiting
        ? "Waiting"
        : pollMeta.status === PollStatus.InProgress
          ? "Opening"
          : pollMeta.status === PollStatus.Counting
            ? "Counting"
            : pollMeta.status === PollStatus.Cancelled
              ? "Cancelled"
              : pollMeta.status === PollStatus.Ended
                ? "Ended"
                : "Unknown";

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black">
      <div className="mx-auto max-w-6xl flex flex-col gap-10">
        {/* Static Shell: Render instantly */}
        <PollHero
          title={pollMeta.title}
          description={pollMeta.description}
          timeframe={pollMeta.timeframe}
          pollId={id}
          badge={badge}
        />

        {/* Dynamic Holes: Stream in later via Factory */}
        <Suspense fallback={<LoadingSkeleton />}>
          <PollViewFactory pollId={id} />
        </Suspense>
      </div>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full rounded-[32px] bg-gray-100" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-[32px] bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
