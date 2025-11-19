import { Button } from "@sasvoth/ui/button";
import { IdeaSubmitFormTrigger } from "@/components/idea-submit-form-trigger";

const enum PollPhase {
  Prepare = "prepare",
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
  author: string;
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
  phase: PollPhase.Prepare,
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
    {
      id: "opt-03",
      label: "Residency Network",
      votes: 1620,
      percentage: 48,
      author: "OpenHall",
    },
    {
      id: "opt-01",
      label: "Storyverse Tools",
      votes: 1120,
      percentage: 33,
      author: "Drift Studio",
    },
    {
      id: "opt-02",
      label: "Signal Relay",
      votes: 620,
      percentage: 19,
      author: "Aiko Lab",
    },
  ],
};

type PhaseSectionProps = { poll: PollData };

const phaseRenderers: Record<
  PollPhase,
  (props: PhaseSectionProps) => React.ReactElement
> = {
  [PollPhase.Prepare]: PrepareSection,
  [PollPhase.Voting]: VotingSection,
  [PollPhase.Tally]: TallySection,
};

const phaseBadges: Record<PollPhase, string> = {
  [PollPhase.Prepare]: "Ideas in review",
  [PollPhase.Voting]: "Opening",
  [PollPhase.Tally]: "Ended",
};

export default function PollPage({ params, searchParams }: PollPageProps) {
  const pollId = params.id;
  const requestedPhase = searchParams?.phase?.toLowerCase() as
    | PollPhase
    | undefined;
  const isPhase = (value: string | undefined): value is PollPhase =>
    value === PollPhase.Prepare ||
    value === PollPhase.Voting ||
    value === PollPhase.Tally;

  const activePhase = isPhase(requestedPhase) ? requestedPhase : mockPoll.phase;
  const PhaseComponent = phaseRenderers[activePhase];

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <PollHero poll={mockPoll} pollId={pollId} badge={phaseBadges[activePhase]} />
        <PhaseComponent poll={{ ...mockPoll, phase: activePhase }} />
      </section>
    </main>
  );
}

function PollHero({
  poll,
  pollId,
  badge,
}: {
  poll: PollData;
  pollId: string;
  badge: string;
}) {
  return (
    <section className="rounded-[40px] border border-black px-8 py-10 shadow-[0_10px_0_#0505050d]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">
            Poll #{pollId}
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{poll.title}</h1>
          <p className="mt-4 max-w-xl text-sm text-black/70">{poll.description}</p>
        </div>
        <span className="self-end text-xs uppercase tracking-[0.3em] text-black">
          {badge}
        </span>
      </div>
      <div className="mt-8 h-20 w-full rounded-[28px] border border-black bg-black/5" />
      <p className="mt-6 text-center text-base font-semibold md:text-left">
        {poll.timeframe.start} — {poll.timeframe.end}
      </p>
    </section>
  );
}

function PrepareSection({ poll }: PhaseSectionProps) {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <p className="text-lg font-semibold">
          Have your own idea? Bring it to the world.
        </p>
        <IdeaSubmitFormTrigger className="rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black">
          Submit new idea
        </IdeaSubmitFormTrigger>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/60">
          Public ideas
        </p>
        <h2 className="text-3xl font-semibold">Explore community submissions</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {poll.ideas.map((idea) => (
          <article
            key={idea.id}
            className="flex h-full flex-col gap-4 rounded-[32px] border border-black bg-white p-6"
          >
            <div className="h-24 rounded-2xl border border-black bg-black/5" />
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/50">
                Idea {idea.id}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{idea.title}</h3>
              <p className="mt-2 text-sm text-black/70">{idea.summary}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-black/60">
                Creator · {idea.creator}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                {idea.credits} cr
              </span>
              <Button
                variant="ghost"
                className="rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
              >
                Read detail
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VotingSection({ poll }: PhaseSectionProps) {
  const highlightedIdeaId =
    poll.ideas.reduce(
      (top, idea) => (idea.credits > top.credits ? idea : top),
      poll.ideas[0]
    )?.id ?? poll.ideas[0]?.id;

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
        <div className="flex flex-col gap-3 text-xs font-semibold uppercase tracking-[0.3em] sm:flex-row">
          <Button
            variant="ghost"
            className="rounded-full border border-black px-6 py-3 text-black hover:bg-black/5"
          >
            View ledger
          </Button>
          <Button className="rounded-full border border-black bg-black px-6 py-3 text-white hover:bg-black">
            Buy credit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {poll.ideas.map((idea) => {
          const isHighlighted = idea.id === highlightedIdeaId;
          return (
            <article
              key={idea.id}
              className={`relative flex h-full flex-col gap-4 rounded-[32px] border bg-white p-6 ${
                isHighlighted
                  ? "border-[#2563eb] shadow-[0_0_0_2px_#2563eb33]"
                  : "border-black"
              }`}
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
              <Button
                variant="ghost"
                className="mt-auto rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
              >
                Read detail
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TallySection({ poll }: PhaseSectionProps) {
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
        <Button
          variant="ghost"
          className="rounded-full border border-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-black hover:bg-black/5"
        >
          View ledger
        </Button>
      </div>

      <div className="space-y-5">
        {poll.results.map((result, index) => (
          <article
            key={result.id}
            className="flex flex-col gap-4 rounded-[32px] border border-black px-6 py-5 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-4 md:w-64">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-black text-base font-semibold ${
                  index === 0 ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                {index + 1}
              </div>
              <div>
                <p className="text-lg font-semibold uppercase">{result.label}</p>
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
        ))}
      </div>
    </section>
  );
}
