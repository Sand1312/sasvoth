import { PollData, Timeline } from "@/lib/polls/service";

type PollHeroProps = {
  title: string;
  description: string;
  timeframe: Timeline;
  pollId: string;
  badge: string;
};

export function PollHero({
  title,
  description,
  timeframe,
  pollId,
  badge,
}: PollHeroProps) {
  return (
    <section className="rounded-[40px] border border-black px-8 py-10 shadow-[0_10px_0_#0505050d]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">
            Poll #{pollId}
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
        </div>
        <span className="self-end text-xs uppercase tracking-[0.3em] text-black">
          {badge}
        </span>
      </div>
      <p className="mt-8 text-center italic text-lg opacity-70">"{description}"</p>
      <p className="mt-6 text-center text-base font-semibold md:text-left">
        {timeframe.start} — {timeframe.end}
      </p>
    </section>
  );
}
