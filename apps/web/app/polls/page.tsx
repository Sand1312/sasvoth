/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Grid3X3, LayoutList, Search } from "lucide-react";

import { Button, buttonVariants } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { cn } from "@sasvoth/ui/lib/utils";

import { usePolls } from "@/hooks";

type PollRecord = {
  _id?: string;
  title?: string;
  description?: string;
  status?:
    | "draft"
    | "active"
    | "ended"
    | "cancelled"
    | "processing"
    | "tallying"
    | string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
  onChainPollId?: number;
};

type ParticipationFilter = "joined" | "contributed";
type ViewMode = "list" | "grid";
type SortKey = "name" | "dateAdded" | "dateModified" | "pollDate";

type PollWithMeta = PollRecord & { participation: ParticipationFilter[] };

const fallbackPolls: PollRecord[] = [
  {
    _id: "mock-1",
    title: "Future of Play",
    description:
      "A curated shortlist of ideas exploring how social games and civic tech overlap.",
    status: "active",
    startTime: "2024-10-12T09:00:00.000Z",
    endTime: "2024-11-24T23:00:00.000Z",
    createdAt: "2024-10-01T12:00:00.000Z",
    updatedAt: "2024-10-20T15:30:00.000Z",
  },
  {
    _id: "mock-2",
    title: "Commons Treasury",
    description:
      "Prioritise open-source infrastructure upgrades for new community-owned treasuries.",
    status: "processing",
    startTime: "2024-08-04T09:00:00.000Z",
    endTime: "2024-09-04T23:00:00.000Z",
    createdAt: "2024-07-28T10:10:00.000Z",
    updatedAt: "2024-08-18T16:00:00.000Z",
  },
  {
    _id: "mock-3",
    title: "Neighborhood Canvas",
    description:
      "Funding round for public artists to reimagine civic billboards and pocket parks.",
    status: "tallying",
    startTime: "2024-06-01T09:00:00.000Z",
    endTime: "2024-06-20T23:00:00.000Z",
    createdAt: "2024-05-10T08:00:00.000Z",
    updatedAt: "2024-06-15T11:45:00.000Z",
  },
  {
    _id: "mock-4",
    title: "Civic Sandbox Residency",
    description:
      "Prototype residency proposals that combine play, stewardship, and tactical urbanism.",
    status: "ended",
    startTime: "2024-03-10T09:00:00.000Z",
    endTime: "2024-04-10T23:00:00.000Z",
    createdAt: "2024-02-20T13:00:00.000Z",
    updatedAt: "2024-04-15T17:20:00.000Z",
  },
  {
    _id: "mock-5",
    title: "All Hands Assembly",
    description:
      "Cross-coalition vote to select facilitators for the 2025 impact assembly tour.",
    status: "draft",
    startTime: "2025-01-05T09:00:00.000Z",
    endTime: "2025-02-05T23:00:00.000Z",
    createdAt: "2024-12-01T09:45:00.000Z",
    updatedAt: "2024-12-14T14:30:00.000Z",
  },
];

const membershipPattern: ParticipationFilter[][] = [
  ["joined"],
  ["contributed"],
  ["joined", "contributed"],
  ["joined"],
  ["contributed"],
];

const statusThemes: Record<
  string,
  { badge: string; text: string; accent: string }
> = {
  active: {
    badge: "bg-green-50 border-green-200 text-green-700",
    text: "text-green-700",
    accent: "bg-green-100",
  },
  processing: {
    badge: "bg-orange-50 border-orange-200 text-orange-700",
    text: "text-orange-700",
    accent: "bg-orange-100",
  },
  tallying: {
    badge: "bg-indigo-50 border-indigo-200 text-indigo-700",
    text: "text-indigo-700",
    accent: "bg-indigo-100",
  },
  ended: {
    badge: "bg-slate-50 border-slate-200 text-slate-700",
    text: "text-slate-700",
    accent: "bg-slate-100",
  },
  draft: {
    badge: "bg-yellow-50 border-yellow-200 text-yellow-800",
    text: "text-yellow-800",
    accent: "bg-yellow-100",
  },
  cancelled: {
    badge: "bg-red-50 border-red-200 text-red-700",
    text: "text-red-700",
    accent: "bg-red-100",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const annotatePolls = (data: PollRecord[]): PollWithMeta[] =>
  data.map((poll, index) => ({
    ...poll,
    participation: membershipPattern[index % membershipPattern.length] ?? [
      "joined",
    ],
  }));

const parseDate = (value?: string | number | Date | null) => {
  if (!value) {
    return null;
  }
  const parsed =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value?: string) => {
  const parsed = parseDate(value);
  return parsed ? dateFormatter.format(parsed) : "—";
};

const getSortMetric = (poll: PollWithMeta, key: SortKey) => {
  switch (key) {
    case "name":
      return (poll.title ?? "").toLowerCase();
    case "dateAdded":
      return parseDate(poll.createdAt ?? poll.startTime)?.getTime() ?? 0;
    case "dateModified":
      return parseDate(poll.updatedAt ?? poll.endTime)?.getTime() ?? 0;
    case "pollDate":
      return parseDate(poll.endTime ?? poll.startTime)?.getTime() ?? 0;
    default:
      return 0;
  }
};

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "dateAdded", label: "Date added" },
  { key: "dateModified", label: "Date modified" },
  { key: "pollDate", label: "Poll Date" },
];

const statusLegend = [
  { key: "active", label: "Active" },
  { key: "processing", label: "Processing" },
  { key: "tallying", label: "Tallying" },
  { key: "ended", label: "Ended" },
  { key: "draft", label: "Draft" },
  { key: "cancelled", label: "Cancelled" },
];

export default function PollsPage() {
  const { getPolls } = usePolls();
  const [polls, setPolls] = useState<PollWithMeta[]>(() =>
    annotatePolls(fallbackPolls)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [participationFilter, setParticipationFilter] =
    useState<ParticipationFilter>("joined");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({ key: "dateAdded", direction: "desc" });

  useEffect(() => {
    const loadPolls = async () => {
      setLoading(true);
      try {
        const response = await getPolls();
        if (Array.isArray(response) && response.length > 0) {
          setPolls(annotatePolls(response));
          setError(null);
        } else {
          setPolls(annotatePolls(fallbackPolls));
          setError("No polls available yet. Showing starter data.");
        }
      } catch (err) {
        console.error("Polls fetch failed", err);
        setError("Unable to reach the polls service. Showing offline data.");
        setPolls(annotatePolls(fallbackPolls));
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, []);

  const visiblePolls = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return [...polls]
      .filter((poll) => poll.participation.includes(participationFilter))
      .filter((poll) => {
        if (!normalizedSearch) return true;
        const haystack = [
          poll.title,
          poll.description,
          poll.status,
          poll.onChainPollId?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const firstMetric = getSortMetric(a, sortConfig.key);
        const secondMetric = getSortMetric(b, sortConfig.key);

        if (
          typeof firstMetric === "string" &&
          typeof secondMetric === "string"
        ) {
          return sortConfig.direction === "asc"
            ? firstMetric.localeCompare(secondMetric)
            : secondMetric.localeCompare(firstMetric);
        }

        const diff = Number(firstMetric) - Number(secondMetric);
        return sortConfig.direction === "asc" ? diff : -diff;
      });
  }, [polls, participationFilter, searchTerm, sortConfig]);

  const handleSortChange = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: key === "name" ? "asc" : "desc" };
    });
  };

  const renderEmptyState = () => (
    <div className="px-6 py-16 text-center">
      <p className="text-lg font-semibold">
        Nothing to show in{" "}
        {participationFilter === "joined" ? "Joined" : "Contributed"} polls yet.
      </p>
      <p className="mt-2 text-sm text-black/60">
        Try switching the view toggle or clear your filters to explore other
        poll collections.
      </p>
    </div>
  );

  return (
    <main className="min-h-screen px-4 py-12 text-black md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[30px] border border-black/10 bg-white p-8 shadow-lg">
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-black/20 bg-white px-5 py-3">
              <Search className="size-5 text-black/40" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search a poll or keyword"
                className="h-auto border-none bg-transparent px-0 text-base placeholder:text-black/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              variant="secondary"
              className="rounded-full bg-black px-6 py-6 text-base text-white shadow-none hover:bg-black/90"
            >
              <Search className="mr-2 size-4" />
              Search
            </Button>
            <div className="flex shrink-0 gap-3">
              {(["joined", "contributed"] as ParticipationFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setParticipationFilter(item)}
                    className={cn(
                      "rounded-full border px-6 py-2 text-sm font-semibold transition-colors",
                      participationFilter === item
                        ? "border-black bg-black text-white"
                        : "border-black/40 bg-white text-black hover:border-black/80"
                    )}
                  >
                    {item === "joined" ? "Joined" : "Contributed"}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {sortOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleSortChange(option.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  sortConfig.key === option.key
                    ? "border-black bg-black text-white"
                    : "border-black/30 bg-transparent text-black hover:border-black/80"
                )}
              >
                {option.label}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    sortConfig.key === option.key &&
                      sortConfig.direction === "asc" &&
                      "-scale-y-100"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/60">
            {statusLegend.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block h-3 w-3 rounded-full",
                    statusThemes[key]?.accent ?? "bg-black/30"
                  )}
                />
                <span className="text-xs uppercase tracking-[0.2em]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-orange-600">{error}</p>}
        </section>

        <section className="rounded-[24px] border border-black/10 bg-white shadow">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-black">Poll library</p>
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                {visiblePolls.length} items ·{" "}
                {participationFilter === "joined" ? "Joined" : "Contributed"}
              </p>
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-black/20">
              {(["list", "grid"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition",
                    viewMode === mode
                      ? "bg-black text-white"
                      : "bg-transparent text-black/60 hover:text-black"
                  )}
                >
                  {mode === "list" ? (
                    <LayoutList className="size-4" />
                  ) : (
                    <Grid3X3 className="size-4" />
                  )}
                  {mode === "list" ? "List" : "Grid"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 px-6 py-10">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="animate-pulse rounded-3xl border border-black/5 bg-black/5 px-6 py-8"
                >
                  <div className="h-4 w-1/3 rounded-full bg-black/10" />
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="h-3 rounded-full bg-black/10" />
                    <div className="h-3 rounded-full bg-black/10" />
                    <div className="h-3 rounded-full bg-black/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePolls.length === 0 ? (
            renderEmptyState()
          ) : viewMode === "list" ? (
            <ListView polls={visiblePolls} />
          ) : (
            <GridView polls={visiblePolls} />
          )}
        </section>
      </div>
    </main>
  );
}

function ListView({ polls }: { polls: PollWithMeta[] }) {
  return (
    <div>
      <div className="hidden border-b border-black/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-black/50 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(120px,1fr))_auto]">
        <span>Poll</span>
        <span>Timeline</span>
        <span>Roll</span>
        <span>Actions</span>
      </div>
      <div>
        {polls.map((poll) => (
          <article
            key={poll._id ?? poll.title}
            className="relative border-b border-black/10 px-6 py-6 last:border-none"
          >
            <span
              className={cn(
                "absolute right-0 top-0 h-10 w-10 rounded-bl-3xl",
                statusThemes[poll.status ?? ""]?.accent ?? "bg-black/10"
              )}
              aria-hidden
            />
            <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(120px,1fr))_auto] md:items-center">
              <div>
                <p className="text-lg font-semibold">{poll.title}</p>
                <p className="mt-2 text-sm text-black/60">{poll.description}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                  Timeline
                </p>
                <p className="mt-2 text-sm font-medium text-black">
                  {formatDate(poll.startTime)} – {formatDate(poll.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50 md:hidden">
                  Roll
                </p>
                <p className="mt-2 text-sm text-black/70">
                  {poll.participation.includes("contributed")
                    ? "Contributor"
                    : "Member"}
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link
                  href={poll._id ? `/polls/${poll._id}` : "#"}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "rounded-full border border-black px-5 text-sm font-semibold text-black hover:bg-black hover:text-white"
                  )}
                >
                  View poll
                </Link>
                <p className="text-xs text-black/40">
                  Updated {formatDate(poll.updatedAt ?? poll.endTime)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function GridView({ polls }: { polls: PollWithMeta[] }) {
  return (
    <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
      {polls.map((poll) => (
        <article
          key={poll._id ?? poll.title}
          className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-black/10 bg-white px-6 py-6 shadow-[0px_20px_35px_rgba(15,15,15,0.08)]"
        >
          <span
            className={cn(
              "absolute right-0 top-0 h-12 w-12 rounded-bl-[30px]",
              statusThemes[poll.status ?? ""]?.accent ?? "bg-black/10"
            )}
            aria-hidden
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                Poll
              </p>
              <h3 className="mt-2 text-xl font-semibold">{poll.title}</h3>
            </div>
          </div>
          <p className="mt-4 flex-1 text-sm text-black/60">
            {poll.description}
          </p>
          <dl className="mt-6 grid gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-black/40">
                Poll window
              </dt>
              <dd className="mt-1 font-semibold">
                {formatDate(poll.startTime)} – {formatDate(poll.endTime)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-black/40">
                Role
              </dt>
              <dd className="mt-1 font-medium text-black">
                {poll.participation.includes("contributed")
                  ? "Contributor"
                  : "Participant"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-black/40">
                Updated
              </dt>
              <dd className="mt-1 font-medium">
                {formatDate(poll.updatedAt ?? poll.endTime)}
              </dd>
            </div>
          </dl>
          <Link
            href={poll._id ? `/polls/${poll._id}` : "#"}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
          >
            Open poll
          </Link>
        </article>
      ))}
    </div>
  );
}
