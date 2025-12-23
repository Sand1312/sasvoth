import Link from "next/link";
import { PollData } from "@/lib/polls/service";
import { TallyButton } from "../interactive/tally-button";
import { Button } from "@sasvoth/ui/button";
import { PollStatus } from "@/types/polls";

type EndedViewProps = {
  poll: PollData;
};

export function EndedView({ poll }: EndedViewProps) {
  const isCounting = poll.status === PollStatus.Counting;
  const hasResults = poll.results.length > 0;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            {isCounting ? "Status" : "Spend credit"}
          </p>
          <p className="text-3xl font-semibold">
            {isCounting ? (
              <span className="text-indigo-600">Counting votes...</span>
            ) : (
              <>
                {poll.credits.spent}{" "}
                <span className="text-black/40">/ {poll.credits.total}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            className="rounded-full border border-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
          >
            View ledger
          </Button>
          
          {/* Tally Button - Show when counting (no results yet) */}
          {isCounting && (
            <TallyButton 
              onChainId={poll.onChainId} 
              resultsCount={poll.results.length} 
              status={poll.status}
              pollId={poll.id}
            />
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Counting state - tally not yet done */}
        {isCounting && !hasResults && (
          <div className="text-center py-16 bg-indigo-50 rounded-[32px] border border-indigo-200">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-indigo-900">Voting has ended</p>
            <p className="text-indigo-700 mt-2">
              Results are pending calculation.
            </p>
            <p className="text-sm text-indigo-600 mt-4">
              If you are an admin, click <strong>&quot;Tally Results&quot;</strong> above to start counting.
            </p>
          </div>
        )}

        {/* Ended with results */}
        {hasResults && poll.results.map((result, index) => (
          <Link
            key={result.id}
            href={`/votes/${result.id}`}
            className="block group"
          >
            <article className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 transition-colors hover:bg-gray-50 cursor-pointer md:flex-row md:items-center">
              <div className="flex items-center gap-4 md:w-64">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-black text-base font-semibold ${
                    index === 0 ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-lg font-semibold uppercase">
                    {result.label}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/60">
                    {result.author}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm font-semibold text-black/70">
                  <span>{result.votes} votes</span>
                  <span>{result.percentage}%</span>
                </div>
                <div className="mt-2 h-4 w-full overflow-hidden rounded-full border border-black bg-white">
                  <div
                    className="h-full bg-black"
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
