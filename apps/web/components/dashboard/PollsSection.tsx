"use client";

import React from "react";
import Link from "next/link";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@sasvoth/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@sasvoth/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyTitle,
  EmptyDescription,
} from "@sasvoth/ui/empty";
import { Input } from "@sasvoth/ui/input";
import { ScrollArea } from "@sasvoth/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sasvoth/ui/select";
import { usePollSearch } from "@/hooks/usePollSearch";
import { PollStatus, Poll } from "@/types/polls";

const statusOptions = [
  { value: PollStatus.InProgress, label: "In Progress" },
  { value: PollStatus.Prepare, label: "Prepare" },
  { value: PollStatus.Counting, label: "Counting" },
  { value: PollStatus.Ended, label: "Ended" },
];

export function PollsSection() {
  const {
    filteredPolls,
    isLoading: loadingPolls,
    error: pollError,
    refetch,
    pollStatusTab,
    setPollStatusTab,
    searchTerm,
    setSearchTerm,
  } = usePollSearch(PollStatus.InProgress);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-6 pb-24 md:pb-10">
      <div className="rounded-[30px] border border-black/10 bg-white p-4 md:p-8 shadow-lg">
        {/* Mobile Header: Title + Refresh */}
        <div className="flex items-center justify-between md:hidden mb-4">
          <h2 className="text-2xl font-bold text-black">Polls</h2>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 bg-white"
            onClick={() => refetch()}
            disabled={loadingPolls}
            aria-label="Refresh polls"
          >
            <RefreshCw
              className={`w-5 h-5 ${loadingPolls ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Mobile Status Select */}
        <div className="md:hidden mb-4">
          <Select
            value={pollStatusTab}
            onValueChange={(val) => setPollStatusTab(val as PollStatus)}
          >
            <SelectTrigger className="w-full rounded-full border-black/20">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <Input
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-full border-black/20 bg-white focus-visible:ring-black"
            />
          </div>
        </div>

        {/* Desktop Header: Title + Search + Status Tabs + Refresh */}
        <div className="hidden md:flex flex-wrap items-center gap-6 mb-8">
          <h2 className="text-3xl font-bold text-black">Polls</h2>

          {/* Search Bar */}
          <div className="relative w-full max-w-xs md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <Input
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-full border-black/20 bg-white focus-visible:ring-black"
            />
          </div>

          <Tabs
            value={pollStatusTab}
            onValueChange={(val) => setPollStatusTab(val as PollStatus)}
            className="mr-auto"
          >
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
              {statusOptions.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-full border border-black/20 px-4 py-2 text-sm data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black transition-all hover:bg-black/5"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button
            className="rounded-full border border-black bg-black text-white hover:bg-black/90 w-8 h-8 p-0 flex items-center justify-center ml-auto"
            onClick={() => refetch()}
            disabled={loadingPolls}
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingPolls ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Polls Loading State */}
        {loadingPolls && (
          <div className="w-full flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent mx-auto mb-4"></div>
              <p className="text-black/60 text-sm">Loading polls...</p>
            </div>
          </div>
        )}

        {/* Polls Error State */}
        {pollError && !loadingPolls && (
          <Empty>
            <EmptyContent>
              <EmptyTitle>Error loading polls</EmptyTitle>
              <EmptyDescription>
                {(pollError as Error).message || "Unknown error"}
              </EmptyDescription>
              <Button
                onClick={() => refetch()}
                className="mt-4 rounded-full border border-black bg-black text-white hover:bg-black/90"
              >
                Try Again
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {!loadingPolls && !pollError && (
          <ScrollArea className="h-[600px] -mr-4 pr-4">
            {filteredPolls.length === 0 ? (
              <Empty className="w-full py-12">
                <EmptyContent>
                  <EmptyTitle>No polls found</EmptyTitle>
                  <EmptyDescription>
                    {searchTerm
                      ? `No polls matching "${searchTerm}"`
                      : "Check back later for new voting opportunities"}
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                {filteredPolls.map((poll: Poll) => (
                  <Link
                    key={poll._id}
                    href={`/votes/${poll.onChainPollId}`}
                    className="group bg-white rounded-[24px] border border-black/10 flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="px-5 py-4 border-b border-black/5 bg-gray-50/50">
                      <h3 className="font-bold text-lg text-black truncate uppercase tracking-wide">
                        {poll.title}
                      </h3>
                    </div>
                    <div className="px-6 py-5 flex flex-col gap-4 flex-grow">
                      <p className="text-black/70 text-sm line-clamp-3 min-h-[3.5rem] leading-relaxed">
                        {poll.description || "No description available"}
                      </p>
                      <div className="text-xs text-black/50 mt-auto space-y-2 pt-4 border-t border-black/5">
                        <div className="flex justify-between items-center">
                          <span className="uppercase tracking-wider font-medium text-[10px]">
                            Options
                          </span>
                          <span className="font-bold text-black bg-black/5 px-2 py-0.5 rounded-full">
                            {poll.options.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="uppercase tracking-wider font-medium text-[10px]">
                            Ends
                          </span>
                          <span className="font-bold text-black">
                            {new Date(poll.endTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button className="mt-2 w-full rounded-full border border-black bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/80 py-4 h-auto">
                        {poll.status === PollStatus.InProgress
                          ? "Vote Now"
                          : "View Poll"}
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </section>
  );
}
