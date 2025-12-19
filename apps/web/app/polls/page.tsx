/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Grid3X3, LayoutList, Search } from "lucide-react";

import { Button, buttonVariants } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { cn } from "@sasvoth/ui/lib/utils";
import { DatePicker } from "@sasvoth/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sasvoth/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@sasvoth/ui/tabs";
import { Empty, EmptyContent, EmptyTitle, EmptyDescription } from "@sasvoth/ui/empty";
import { Skeleton } from "@sasvoth/ui/skeleton";
import { Spinner } from "@sasvoth/ui/spinner";

import { usePolls } from "@/hooks";
import { PollStatus } from "@/types/polls";
import { formatDate, parseDate } from "@/lib/date";

import { DataTable } from "@sasvoth/ui/data-table";
import { columns, PollData } from "./components/columns";

import fallbackPollsData from "@/data/fallback-polls.json";

type PollRecord = {
  _id?: string;
  title?: string;
  description?: string;
  status?: PollStatus;
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

const fallbackPolls: PollRecord[] = fallbackPollsData as unknown as PollRecord[];

const membershipPattern: ParticipationFilter[][] = [
  ["joined"],
  ["contributed"],
  ["joined", "contributed"],
  ["joined"],
  ["contributed"],
];

// Cleaned up status themes with simpler structure
const statusThemes: Record<PollStatus, string> = {
  [PollStatus.Prepare]: "bg-emerald-500",
  [PollStatus.InProgress]: "bg-orange-500",
  [PollStatus.Counting]: "bg-indigo-500",
  [PollStatus.Ended]: "bg-slate-500",
  [PollStatus.Draft]: "bg-amber-500",
  [PollStatus.Cancelled]: "bg-red-600",
  [PollStatus.Waiting]: "bg-sky-500",
};

const annotatePolls = (data: PollRecord[]): PollWithMeta[] =>
  data.map((poll, index) => ({
    ...poll,
    participation: membershipPattern[index % membershipPattern.length] ?? [
      "joined",
    ],
  }));


const statusLegend = [
  { key: PollStatus.Prepare, label: "Prepare" },
  { key: PollStatus.InProgress, label: "In progress" },
  { key: PollStatus.Counting, label: "Counting" },
  { key: PollStatus.Ended, label: "Ended" },
  { key: PollStatus.Draft, label: "Draft" },
  { key: PollStatus.Cancelled, label: "Cancelled" },
];

export default function PollsPage() {
  const {getPollsPaginated } = usePolls();
  const [polls, setPolls] = useState<PollWithMeta[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // First load - shows skeleton
  const [loading, setLoading] = useState(false); // Subsequent loads - shows overlay
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [participationFilter, setParticipationFilter] =
    useState<ParticipationFilter[]>([]);
  const [statusFilter, setStatusFilter] = useState<PollStatus | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Date picker for activeAt filter
  const [activeAtDate, setActiveAtDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const loadPolls = async () => {
      // Only show loading overlay for subsequent loads, not initial
      if (!initialLoading) {
        setLoading(true);
      }
      try {
        const response = await getPollsPaginated({
          page,
          limit,
          status: statusFilter ?? undefined,
          activeAt: activeAtDate,
          search: searchTerm.trim() || undefined,
        });
        if (response.polls && response.polls.length > 0) {
          setPolls(annotatePolls(response.polls));
          setTotal(response.total);
          setError(null);
        } else {
          setPolls([]);
          setTotal(0);
          if (page === 1) {
            setError("No polls available yet.");
          }
        }
      } catch (err) {
        console.error("Polls fetch failed", err);
        setError("Unable to reach the polls service. Showing offline data.");
        setPolls(annotatePolls(fallbackPolls));
        setTotal(fallbackPolls.length);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoading(false);
        }
      }
    };

    loadPolls();
    return () => {
      isMounted = false;
    };
  }, [page, limit, statusFilter, activeAtDate, searchTerm]);

  // With server-side pagination, polls state IS the current page data
  // Filter only by participation (client-side) since backend doesn't know about it
  const visiblePolls = useMemo(() => {
    if (participationFilter.length === 0) return polls;
    return polls.filter((poll) => 
      poll.participation.some(p => participationFilter.includes(p))
    );
  }, [polls, participationFilter]);

  const toggleParticipationFilter = (filter: ParticipationFilter) => {
    setParticipationFilter((current) => 
      current.includes(filter)
        ? current.filter((f) => f !== filter)
        : [...current, filter]
    );
  };

  const toggleStatusFilter = (status: PollStatus) => {
    setStatusFilter((current) => (current === status ? null : status));
  };
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
              <Search className="mr-2 w-4 h-4" />
              Search
            </Button>
            <div className="flex shrink-0 gap-3">
            <div className="flex shrink-0 gap-3">
              {(["joined", "contributed"] as ParticipationFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleParticipationFilter(item)}
                    className={cn(
                      "rounded-full border px-6 py-2 text-sm font-semibold transition-colors",
                      participationFilter.includes(item)
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
          </div>

          {/* Date picker for "active at" filter */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-black/60">Filter by active date:</span>
            <DatePicker
              date={activeAtDate}
              onSelect={(date) => {
                setActiveAtDate(date);
                setPage(1); // Reset to first page when filter changes
              }}
              placeholder="Select date..."
            />
            {activeAtDate && (
              <span className="text-xs text-black/50">
                Showing polls that would be active on this date
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/60">
            {statusLegend.map(({ key, label }) => (
              <button
                 key={key}
                 onClick={() => toggleStatusFilter(key)}
                 className={cn(
                   "flex items-center gap-2 rounded-full px-3 py-1 transition-all border cursor-pointer",
                   statusFilter === key 
                    ? "bg-gray-100 border-black ring-1 ring-black" 
                    : "bg-transparent border-transparent hover:bg-gray-100 hover:border-black/10"
                 )}
              >
                <span
                  className={cn(
                    "inline-block h-3 w-3 rounded-full",
                    statusThemes[key]
                  )}
                />
                <span className={cn(
                  "text-xs uppercase tracking-[0.2em]",
                  statusFilter === key && "font-bold text-black"
                )}>
                  {label}
                </span>
              </button>
            ))}
            {statusFilter && (
                <Button 
                    variant="link"
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                    className="ml-2 text-xs text-black/40 hover:text-black"
                >
                    Clear Filter
                </Button>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-orange-600">{error}</p>}
        </section>

        <section className="rounded-[24px] border border-black/10 bg-white shadow">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-black">Poll library</p>
              <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                {total} items ·{" "}
                {participationFilter.length === 0 
                  ? "All Polls" 
                  : participationFilter.map(f => f === "joined" ? "Joined" : "Contributed").join(" & ")}
              </p>
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-black/20">
            <div className="inline-flex items-center">
              <Tabs
                defaultValue="list"
                value={viewMode}
                onValueChange={(val) => setViewMode(val as ViewMode)}
              >
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 gap-2">
                  <TabsTrigger 
                    value="list"
                    className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full border border-transparent data-[state=active]:border-black hover:border-black/20 transition-all px-4 py-2 h-auto"
                  >
                    <LayoutList className="mr-2 size-4" />
                    List
                  </TabsTrigger>
                  <TabsTrigger 
                    value="grid"
                    className="data-[state=active]:bg-black data-[state=active]:text-white rounded-full border border-transparent data-[state=active]:border-black hover:border-black/20 transition-all px-4 py-2 h-auto"
                  >
                    <Grid3X3 className="mr-2 size-4" />
                    Grid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            </div>
          </div>

          {/* Content area with loading overlay for pagination */}
          <div className="relative min-h-[400px]">
            {(loading || initialLoading) ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                 <Spinner className="w-8 h-8" />
              </div>
            ) : null}

            {visiblePolls.length === 0 && !loading && !initialLoading ? (
              <Empty>
                <EmptyContent>
                  <EmptyTitle>Nothing to show in {participationFilter.length === 0 ? "All" : participationFilter.join(", ")} polls yet.</EmptyTitle>
                  <EmptyDescription>Try switching the view toggle, clearing filters, or changing status selection.</EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : viewMode === "list" ? (
              <DataTable 
                columns={columns} 
                data={visiblePolls as PollData[]}
                searchValue={searchTerm}
                statusFilter={statusFilter}
                page={page}
                limit={limit}
                total={total}
                onPageChange={(newPage) => setPage(newPage)}
              />
            ) : (
              <GridView polls={visiblePolls} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function GridView({ polls }: { polls: PollWithMeta[] }) {
  return (
    <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
      {polls.map((poll) => {
        const theme = statusThemes[poll.status ?? PollStatus.Draft];
        return (
          <Card
            key={poll._id ?? poll.title}
            className="relative flex flex-col rounded-[24px] border-black/10 bg-white shadow-[0px_20px_35px_rgba(15,15,15,0.08)]"
          >
            {/* Status corner indicator */}
            <span
              className={cn(
                "absolute right-0 top-0 h-10 w-10 rounded-bl-[24px]",
                theme ?? "bg-black/10"
              )}
              aria-hidden
            />
            
            <CardHeader className="gap-3 pb-0">
              <div className="text-xs uppercase tracking-[0.3em] text-black/40">
                Poll
              </div>
              <CardTitle className="text-xl font-semibold">
                {poll.title}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {poll.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-4 grid gap-3 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-black/40">
                    Poll window
                  </span>
                  <p className="mt-1 font-semibold">
                    {formatDate(poll.startTime)} – {formatDate(poll.endTime)}
                  </p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Role
                    </span>
                    <p className="mt-1 font-medium">
                      {poll.participation.some(p => p === "contributed")
                        ? "Contributor"
                        : "Participant"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-black/40">
                      Updated
                    </span>
                    <p className="mt-1 font-medium">
                      {formatDate(poll.updatedAt ?? poll.endTime)}
                    </p>
                  </div>
                </div>
            </CardContent>

            <CardFooter className="mt-auto pt-4 pb-6">
              <Link
                href={poll._id ? `/polls/${poll._id}` : "#"}
                className="inline-flex w-full items-center justify-center rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90"
              >
                Open poll
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
