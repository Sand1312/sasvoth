import Link from "next/link";
import { PollData } from "@/lib/polls/service";
import { PollStatus } from "@/types/polls";
import { IdeaSubmit } from "../interactive/idea-submit";

type PrepareViewProps = {
  poll: PollData;
};

function getLogoSrc(logo?: string) {
  if (!logo) return null;
  if (logo.startsWith("ipfs://")) {
    return `/api/v1/ipfs/${logo.replace("ipfs://", "")}`;
  }
  if (logo.startsWith("/") || logo.startsWith("http")) {
    return logo;
  }
  return `/api/v1/ipfs/${logo}`;
}

export function PrepareView({ poll }: PrepareViewProps) {
  // Logic from PrepareSection
  const isDeployed = Boolean(poll.onChainId && poll.onChainId !== "0");
  const isCancelled = poll.status === PollStatus.Cancelled;
  const canSubmit = !isDeployed && !isCancelled;

  return (
    <section className="space-y-8">
      {canSubmit ? (
        <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="text-lg font-semibold">
            Have your own idea? Bring it to the world.
          </p>
          <IdeaSubmit pollId={poll.id} />
        </div>
      ) : (
        <div className="rounded-[32px] border border-gray-200 bg-gray-50 px-6 py-5 text-center text-gray-500">
          {isCancelled
            ? "This poll has been cancelled. No new submissions."
            : "Poll has started. New submissions are closed."}
        </div>
      )}

      {/* Approved Ideas Section */}
      {poll.approvedIdeas.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-emerald-800">
            Approved Competitors
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poll.approvedIdeas.map((idea) => {
              const src = getLogoSrc(idea.logo);
              return (
                <article
                  key={idea._id}
                  className="flex aspect-square flex-col gap-4 rounded-[32px] border border-emerald-500 bg-emerald-50/50 p-6"
                >
                  <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200 bg-white">
                    {src ? (
                      <img
                        src={src}
                        alt={idea.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs uppercase tracking-widest text-emerald-500">
                        No Logo
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="mt-1 text-xl font-semibold text-emerald-900">
                      {idea.title}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-800/70">
                      {idea.summary}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-600">
                      Creator · {idea.creator}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Approved
                    </span>
                    <Link
                      href={`/votes/${idea._id}`}
                      className="rounded-full border border-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-900 hover:bg-emerald-100"
                    >
                      Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Ideas Section */}
      <div>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Pending Review
          </p>
          <h2 className="text-3xl font-semibold">Community Ideas</h2>
        </div>

        {poll.ideas.length === 0 ? (
          <p className="text-gray-500 italic">No pending ideas.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {poll.ideas.map((idea) => (
              <article
                key={idea._id}
                className="flex h-full flex-col gap-4 rounded-[32px] border border-black bg-white p-6"
              >
                <div className="h-24 rounded-2xl border border-black bg-black/5" />
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                    ID: {idea._id.slice(0, 8)}...
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{idea.title}</h3>
                  <p className="mt-2 text-sm text-black/70">{idea.summary}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/60">
                    Creator · {idea.creator}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                    Pending
                  </span>
                  <Link
                    href={`/votes/${idea._id}`}
                    className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
                  >
                    Read detail
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
