import Link from "next/link";
import { PollData } from "@/lib/polls/service";
import { VotingControls } from "../interactive/voting-controls";

type VotingViewProps = {
  poll: PollData;
};

export function VotingView({ poll }: VotingViewProps) {
  // In VotingView, we expect 'ideas' (approvedOptions) to be pre-hydrated by the service layer.
  // The service layer populates `approvedIdeas` with hydrated data from `options` or `approvedIdeaIds`.
  // If `approvedIdeas` is empty, we fallback to `poll.ideas` (this was logic in PollClient, line ~694).
  
  const displayIdeas =
    poll.approvedIdeas.length > 0 ? poll.approvedIdeas : poll.ideas;

  // We can calculate highlited idea if needed, but for server component we might want to skip "dynamic" highlighting based on current user votes unless we fetch it.
  // The original code calculated `highlightedIdeaId` based on credits, but that was client state `ideas` which was derived from... metadata.
  // Here we display the static list.

  return (
    <section className="space-y-8">
      {/* Interactive Voting Controls Island */}
      <VotingControls 
        credits={poll.credits}
        pollId={poll.id}
        pollIdOnChain={poll.onChainId}
        maciAddress={poll.maciAddress}
      />

      {/* Ideas List */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {displayIdeas.map((idea) => {
          return (
            <article
              key={idea._id}
              className="relative flex h-full flex-col gap-4 rounded-[32px] border border-black bg-white p-6"
            >
              <div className="h-24 rounded-2xl border border-black bg-black/5" />
              <div>
                <h3 className="text-xl font-semibold">{idea.title}</h3>
                <p className="mt-2 text-sm text-black/70">{idea.summary}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/60">
                  Creator · {idea.creator}
                </p>
              </div>
              <span className="absolute right-6 top-6 rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {idea.credits} cr
              </span>
              <Link
                href={`/votes/${idea._id}`}
                className="mt-auto rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
              >
                Read detail
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
