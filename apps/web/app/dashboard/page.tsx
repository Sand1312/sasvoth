"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@sasvoth/ui/button";
import React, { useState, useEffect, useMemo } from "react";
import { usePolls } from "../../hooks";
// Types cho Poll
type Poll = {
  _id: string;
  title: string;
  description: string;
  category: string;
  onChainPollId: number;
  status:
    | "draft"
    | "active"
    | "ended"
    | "cancelled"
    | "processing"
    | "tallying";
  startTime: string;
  endTime: string;
  options: {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
  };
};

type VotePhase = "prepare" | "voting" | "tally";
type VoteCard = {
  id: number;
  title: string;
  highlight: string;
  date: string;
  amount: number;
  token: string;
  phase: VotePhase;
  rewarded?: boolean;
};

const mockVotes: VoteCard[] = [
  {
    id: 1,
    title: "Tên cuộc vote",
    highlight: "#1 silk song",
    date: "2024-06-10",
    amount: 30,
    token: "HD",
    phase: "voting",
  },
  {
    id: 2,
    title: "Civic mixtape",
    highlight: "#3 east market",
    date: "2024-06-12",
    amount: 22,
    token: "HD",
    phase: "prepare",
  },
  {
    id: 3,
    title: "Futures residency",
    highlight: "#8 sonic bloom",
    date: "2024-06-05",
    amount: 45,
    token: "HD",
    phase: "tally",
    rewarded: true,
  },
  {
    id: 4,
    title: "Tên cuộc vote",
    highlight: "#6 river pulse",
    date: "2024-06-02",
    amount: 18,
    token: "HD",
    phase: "prepare",
  },
];

const phaseStyles: Record<VotePhase, { label: string; accent: string }> = {
  prepare: {
    label: "Prepare",
    accent: "#1E40AF",
  },
  voting: {
    label: "Voting",
    accent: "#0B8A44",
  },
  tally: {
    label: "Tally",
    accent: "#B45309",
  },
};

// API functions

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "date" | "token";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [phaseFilter, setPhaseFilter] = useState<"all" | VotePhase>("all");

  // --- Polls state ---
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [pollError, setPollError] = useState<string>("");
  const { getPolls } = usePolls();

  useEffect(() => {
    setIsClient(true);
    loadPolls();
  }, []);

  // Load polls từ API
  const loadPolls = async () => {
    try {
      setLoadingPolls(true);
      const data = await getPolls("active");
      setActivePolls(data);
      setPolls(data); // Hiển thị active polls mặc định
    } catch (error) {
      setPollError("Failed to load polls");
      console.error("Error loading polls:", error);
    } finally {
      setLoadingPolls(false);
    }
  };

  const handleSortClick = (key: "name" | "date" | "token") => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { key, direction: key === "name" ? "asc" : "desc" };
    });
  };

  const visibleVotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let data = [...mockVotes];

    if (normalizedSearch) {
      data = data.filter((vote) =>
        [vote.title, vote.highlight]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    }
    if (phaseFilter !== "all") {
      data = data.filter((vote) => vote.phase === phaseFilter);
    }

    return data.sort((a, b) => {
      if (sortConfig.key === "name") {
        const nameCompare = a.highlight.localeCompare(b.highlight);
        return sortConfig.direction === "asc" ? nameCompare : -nameCompare;
      }
      if (sortConfig.key === "token") {
        const tokenCompare = a.token.localeCompare(b.token);
        return sortConfig.direction === "asc" ? tokenCompare : -tokenCompare;
      }

      const dateCompare =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortConfig.direction === "asc" ? dateCompare : -dateCompare;
    });
  }, [searchTerm, sortConfig, phaseFilter]);

  const legendEntries = Object.entries(phaseStyles);
  const phaseFilters: Array<{
    key: "all" | VotePhase;
    label: string;
    accent: string;
  }> = [
    { key: "all", label: "All statuses", accent: "#111827" },
    ...Object.entries(phaseStyles).map(([key, value]) => ({
      key: key as VotePhase,
      label: value.label,
      accent: value.accent,
    })),
  ];

  // Loading state cho SSR
  if (!isClient) {
    return (
      <div className="flex gap-8 mt-8 items-start justify-center px-6 py-6">
        {/* LEFT: Your Vote Skeleton */}
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="h-8 w-32 rounded bg-gray-200 animate-pulse"></div>
            <div className="h-10 flex-1 min-w-[200px] rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-8 w-20 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-[20px] border border-black/5 bg-gray-200 px-5 py-4 shadow animate-pulse"
              >
                <div className="mb-3 h-4 w-3/4 rounded bg-gray-300"></div>
                <div className="mb-2 h-6 w-1/2 rounded bg-gray-300"></div>
                <div className="h-3 w-1/3 rounded bg-gray-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-10 px-6 py-6">
        {/* LEFT: Your Vote */}
        <div className="w-full">
          <div className="mb-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                Your Vote
              </h2>
              <p className="text-sm text-gray-500">
                Browse ideas you&apos;ve backed. Filter by status, search, or
                sort them by name, date, or token.
              </p>
            </div>

            <div className="relative w-full max-w-lg">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 3 3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-black/10 bg-white py-3 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow focus:border-black focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["name", "date", "token"] as const).map((key) => {
                const isActive = sortConfig.key === key;
                const directionArrow =
                  sortConfig.direction === "asc" ? "↑" : "↓";
                const label =
                  key === "name" ? "Name" : key === "date" ? "Date" : "Token";
                return (
                  <button
                    key={key}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-black bg-black text-white"
                        : "border-black/20 bg-white text-gray-700 hover:border-black/60"
                    }`}
                    onClick={() => handleSortClick(key)}
                  >
                    {label} {isActive ? directionArrow : "↕"}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {phaseFilters.map(({ key, label, accent }) => {
                const isActive = phaseFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPhaseFilter(key)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={{
                      borderColor: accent,
                      backgroundColor: isActive ? accent : "transparent",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
              {legendEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: value.accent }}
                  />
                  {value.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleVotes.map((vote) => {
              const style = phaseStyles[vote.phase];
              return (
                <div
                  key={vote.id}
                  className="relative overflow-hidden rounded-[20px] border border-black/5 bg-[#E7E7E7] p-5 shadow-sm"
                >
                  <span
                    className="absolute right-0 top-0 h-10 w-10"
                    style={{
                      backgroundColor: style.accent,
                      clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                    }}
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 uppercase tracking-wide">
                        {vote.title}
                      </h3>
                      <p className="text-base font-semibold text-red-600">
                        {vote.highlight}
                      </p>
                      <p className="text-xs text-gray-600">{vote.date}</p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <p className="text-3xl font-black text-gray-900 leading-tight">
                        {vote.amount}{" "}
                        <span className="text-lg font-semibold">
                          {vote.token}
                        </span>
                      </p>
                      {vote.rewarded ? (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                          <Image
                            src="/sunflower.svg"
                            alt="Reward earned"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                          />
                          Reward
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleVotes.length === 0 && (
              <div className="col-span-1 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 md:col-span-2">
                No votes match your filters yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Votes Section với Polls từ API */}
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-black p-8 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-8">
            <h2 className="text-2xl font-bold text-black tracking-tight">
              Active Votes
            </h2>
            <div className="flex gap-2">
              <Button
                asChild
                className="text-sm bg-purple-600 hover:bg-purple-700"
              >
                <Link href="/transactions">Manage Transactions</Link>
              </Button>
              <Button
                className="text-sm bg-blue-600 hover:bg-blue-700"
                onClick={loadPolls}
                disabled={loadingPolls}
              >
                {loadingPolls ? "Loading..." : "Refresh Polls"}
              </Button>
            </div>
          </div>

          {/* Polls Loading State */}
          {loadingPolls && (
            <div className="w-full flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải polls...</p>
              </div>
            </div>
          )}

          {/* Polls Error State */}
          {pollError && !loadingPolls && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="text-red-800 text-center">
                <p className="font-semibold">Lỗi khi tải polls</p>
                <p className="text-sm mt-2">{pollError}</p>
                <Button
                  onClick={loadPolls}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          )}

          {/* Polls Grid */}
          {!loadingPolls && !pollError && (
            <div className="flex flex-wrap gap-8 w-full justify-center">
              {activePolls.length === 0 ? (
                <div className="w-full text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Không có poll nào đang active
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Hãy tạo poll mới hoặc thử lại sau
                  </p>
                </div>
              ) : (
                activePolls.map((poll, idx) => (
                  <div
                    key={poll._id}
                    className="w-64 bg-white rounded-xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl border border-black flex flex-col cursor-pointer"
                    onClick={() => {
                      window.location.href = `/votes/${poll.onChainPollId}`;
                    }}
                    tabIndex={0}
                    role="button"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        window.location.href = `/votes/${poll.onChainPollId}`;
                      }
                    }}
                  >
                    <div className="px-4 py-3 border-b border-black">
                      <h3 className="text-center font-semibold text-lg text-black">
                        {poll.title}
                      </h3>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2 flex-grow">
                      <p className="text-black text-sm line-clamp-2">
                        {poll.description || "No description"}
                      </p>
                      <div className="text-xs text-gray-500 mt-auto">
                        <p>Options: {poll.options.length}</p>
                        <p>Status: {poll.status}</p>
                        <p>
                          Ends: {new Date(poll.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/votes/${poll.onChainPollId}`;
                        }}
                      >
                        {poll.status === "active" ? "Vote Now" : "View Poll"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
