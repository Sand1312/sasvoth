import Link from "next/link";
import { PollData } from "@/lib/polls/service";
import { TallyButton } from "../interactive/tally-button";
import { Button } from "@sasvoth/ui/button";

type EndedViewProps = {
  poll: PollData;
};

export function EndedView({ poll }: EndedViewProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Spend credit
          </p>
          <p className="text-3xl font-semibold">
            {poll.credits.spent}{" "}
            <span className="text-black/40">/ {poll.credits.total}</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            className="rounded-full border border-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
          >
            View ledger
          </Button>
          
          {/* Tally Button Island */}
          {poll.results.length === 0 && (
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
        {poll.results.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p>Results are being tallied or pending calculation.</p>
            <p className="text-sm mt-2">
              If you are an admin, click "Tally Results" above.
            </p>
          </div>
        )}
        {poll.results.map((result, index) => (
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
