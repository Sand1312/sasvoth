import { Button } from "@sasvoth/ui/button";

// TODO: replace prevote with another wording term
const enum PollPhase {
  Prevote = "prevote",
  Voting = "voting",
  Tally = "tally",
}

type Timeline = { start: string; end: string };
type Idea = {
  id: string;
  title: string;
  summary: string;
  credits: number;
  votes: number;
  creator: string;
};

type VoteOption = {
  id: string;
  label: string;
  description: string;
  weight: number;
};

type TallyResult = {
  id: string;
  label: string;
  votes: number;
  percentage: number;
};

type PollData = {
  title: string;
  description: string;
  timeframe: Timeline;
  credits: { spent: number; total: number; remaining?: number };
  status: string;
  phase: PollPhase;
  ideas: Idea[];
  options: VoteOption[];
  results: TallyResult[];
};

type PollPageProps = {
  params: { id: string };
  searchParams?: { phase?: string };
};

const mockPoll: PollData = {
  title: "Future of Play",
  description:
    "A curated shortlist of ideas exploring how social games, creative tools, and fan communities will evolve next year.",
  timeframe: { start: "12 Oct 2024", end: "24 Nov 2024" },
  credits: { spent: 36, total: 120, remaining: 84 },
  status: "In progress",
  phase: PollPhase.Voting,
  ideas: [
    {
      id: "01",
      title: "Pocket Worlds SDK",
      summary:
        "Starter kit so any studio can launch a playable social hub in weeks instead of months.",
      credits: 12,
      votes: 214,
      creator: "Drift Studio",
    },
    {
      id: "02",
      title: "Spectator Signals",
      summary:
        "Lightweight overlays that turn Twitch chat reactions into real-time buffs for players.",
      credits: 8,
      votes: 189,
      creator: "Aiko Lab",
    },
    {
      id: "03",
      title: "Civic Season Pass",
      summary:
        "Membership system that lets fans sponsor civic projects and unlock behind-the-scenes drops.",
      credits: 6,
      votes: 132,
      creator: "Studio North",
    },
    {
      id: "04",
      title: "Residency Nights",
      summary:
        "Monthly remote residencies where creators remix each other’s prototypes live for the community.",
      credits: 10,
      votes: 156,
      creator: "OpenHall",
    },
  ],
  options: [
    {
      id: "opt-01",
      label: "Storyverse Tools",
      description:
        "Workflow layer that lets teams remix lore documents live while building quests.",
      weight: 2,
    },
    {
      id: "opt-02",
      label: "Signal Relay",
      description:
        "Open protocol so spectator chats can power in-game stat boosts.",
      weight: 1,
    },
    {
      id: "opt-03",
      label: "Residency Network",
      description:
        "Traveling residency for hybrid creators with livestreamed critiques.",
      weight: 3,
    },
  ],
  results: [
    { id: "opt-03", label: "Residency Network", votes: 1620, percentage: 48 },
    { id: "opt-01", label: "Storyverse Tools", votes: 1120, percentage: 33 },
    { id: "opt-02", label: "Signal Relay", votes: 620, percentage: 19 },
  ],
};

type PhaseSectionProps = { poll: PollData };

const phaseRenderers: Record<
  PollPhase,
  (props: PhaseSectionProps) => React.ReactElement
> = {
  [PollPhase.Prevote]: PrevoteSection,
  [PollPhase.Voting]: VotingSection,
  [PollPhase.Tally]: TallySection,
};

const phaseLabels: Record<PollPhase, string> = {
  [PollPhase.Prevote]: "Idea shortlisting",
  [PollPhase.Voting]: "Voting phase",
  [PollPhase.Tally]: "Results & tally",
};

export default function PollPage({ params, searchParams }: PollPageProps) {
  const pollId = params.id;
  const requestedPhase = searchParams?.phase?.toLowerCase() as
    | PollPhase
    | undefined;
  const isPhase = (value: string | undefined): value is PollPhase =>
    value === PollPhase.Prevote ||
    value === PollPhase.Voting ||
    value === PollPhase.Tally;

  const activePhase = isPhase(requestedPhase) ? requestedPhase : mockPoll.phase;
  const PhaseComponent = phaseRenderers[activePhase];

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-black">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="rounded-[32px] border border-black px-10 py-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Poll #{pollId} · {phaseLabels[activePhase]}
          </p>
          <h1 className="mt-4 text-4xl font-semibold">{mockPoll.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-black/70">
            {mockPoll.description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] text-black/60">
            <span>Timeline</span>
            <span className="text-lg font-semibold tracking-tight text-black">
              {mockPoll.timeframe.start} — {mockPoll.timeframe.end}
            </span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <SharedSidebar poll={mockPoll} />
          <section className="rounded-[28px] border border-black p-7">
            <PhaseComponent poll={{ ...mockPoll, phase: activePhase }} />
          </section>
        </div>
      </section>
    </main>
  );
}

function SharedSidebar({ poll }: { poll: PollData }) {
  return (
    <aside className="rounded-[28px] border border-black p-7">
      <p className="text-xs uppercase tracking-[0.3em] text-black/60">
        Credits spent
      </p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-5xl font-semibold">{poll.credits.spent}</span>
        <span className="text-base text-black/60">/ {poll.credits.total}</span>
      </div>
      {typeof poll.credits.remaining === "number" && (
        <p className="mt-1 text-sm text-black/70">
          {poll.credits.remaining} credits still available.
        </p>
      )}

      <div className="mt-8 space-y-3 text-sm">
        <div className="flex items-center justify-between border-t border-black/20 pt-3">
          <span className="uppercase tracking-[0.2em] text-black/60">
            Status
          </span>
          <span className="font-semibold">{poll.status}</span>
        </div>
        <div className="flex items-center justify-between border-t border-black/20 pt-3">
          <span className="uppercase tracking-[0.2em] text-black/60">
            Start
          </span>
          <span>{poll.timeframe.start}</span>
        </div>
        <div className="flex items-center justify-between border-t border-black/20 pt-3">
          <span className="uppercase tracking-[0.2em] text-black/60">End</span>
          <span>{poll.timeframe.end}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {poll.phase === PollPhase.Voting && (
          <Button className="w-full rounded-full border border-black bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-black">
            Buy credits
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full rounded-full border border-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-black/5"
        >
          View ledger
        </Button>
      </div>
    </aside>
  );
}

function PrevoteSection({ poll }: PhaseSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b border-black/20 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/60">
            Ideas in review
          </p>
          <h2 className="text-2xl font-semibold">
            {poll.ideas.length} shortlisted concepts
          </h2>
          <p className="text-sm text-black/70">
            Use your remaining credits to signal conviction.
          </p>
        </div>
        <Button className="rounded-full border border-black bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-black">
          Submit new idea
        </Button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {poll.ideas.map((idea) => (
          <article
            key={idea.id}
            className="flex h-full flex-col gap-4 rounded-3xl border border-black p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                  Idea {idea.id}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{idea.title}</h3>
              </div>
              <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {idea.credits} cr
              </span>
            </div>
            <p className="text-sm leading-relaxed text-black/75">
              {idea.summary}
            </p>
            <div className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-black/60">
              <span>Votes · {idea.votes}</span>
              <span>Creator · {idea.creator}</span>
            </div>
            <Button
              variant="ghost"
              className="mt-auto rounded-full border border-black px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
            >
              Read detail
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}

function VotingSection({ poll }: PhaseSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-black/20 pb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/60">
          Active ballot
        </p>
        <h2 className="text-2xl font-semibold">
          Allocate your votes to the finalists
        </h2>
        <p className="text-sm text-black/70">
          Each weight equals one vote credit. You currently have{" "}
          {poll.credits.remaining} credits to distribute.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {poll.options.map((option) => (
          <article
            key={option.id}
            className="flex flex-col gap-4 rounded-3xl border border-black p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="md:max-w-xl">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                Option {option.id.replace("opt-", "")}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{option.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-black/75">
                {option.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 text-right">
              <span className="text-xs uppercase tracking-[0.3em] text-black/60">
                Weight {option.weight}x
              </span>
              <Button className="rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black">
                Vote
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function TallySection({ poll }: PhaseSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-black/20 pb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/60">
          Final tally
        </p>
        <h2 className="text-2xl font-semibold">
          Community decision and ranking
        </h2>
        <p className="text-sm text-black/70">
          Results locked on-chain at {poll.timeframe.end}.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {poll.results.map((result, index) => (
          <article
            key={result.id}
            className="flex flex-col gap-4 rounded-3xl border border-black p-5 md:flex-row md:items-center"
          >
            <div className="h-32 w-full rounded-2xl border border-black bg-gradient-to-b from-white to-black/[0.04] text-center text-xs uppercase tracking-[0.3em] text-black/50 md:w-40">
              <div className="flex h-full items-center justify-center">
                Image {index + 1}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                Rank {index + 1}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{result.label}</h3>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-black bg-white">
                <div
                  className="h-full bg-black"
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-black/70">
                <span>{result.votes} votes</span>
                <span>{result.percentage}%</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
