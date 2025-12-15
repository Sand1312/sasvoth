"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@sasvoth/ui/button";
import React, { useState, useEffect, useMemo } from "react";
import { usePollsQuery } from "../../hooks/usePolls";
import { PollStatus } from "@/types/polls";
import RainAnimation from "../../components/RainAnimation";
import { useAccount } from "wagmi";
import { useClaimContract, useToken, useUser, useAuth } from "../../hooks";

// Types cho Poll
type Poll = {
  _id: string;
  title: string;
  description: string;
  category: string;
  onChainPollId: number;
  status: PollStatus;
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

type DepositHistory = {
  amount: number;
  timestamp: string;
};

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "date" | "token";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });
  const [phaseFilter, setPhaseFilter] = useState<"all" | VotePhase>("all");

  // Wallet hooks
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const token = useToken();
  const claim = useClaimContract();
  const { deposit, getHistoryDeposit } = useUser();

  // Wallet state
  const [depositAmount, setDepositAmount] = useState<number | "">("");
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [history, setHistory] = useState<DepositHistory[]>([]);
  const [reloadHistory, setReloadHistory] = useState(0);

  // Use the new hook for data fetching
  const {
    data: activePolls = [],
    isLoading: loadingPolls,
    error: pollError,
    refetch,
  } = usePollsQuery(PollStatus.InProgress);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch transaction history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?._id) return;
      try {
        const data = await getHistoryDeposit(user._id);
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch deposit history:", error);
      }
    };
    fetchHistory();
  }, [reloadHistory, user, getHistoryDeposit]);

  const isDepositDisabled = Boolean(
    claim.isBuying || !depositAmount || Number(depositAmount) < 0.001
  );

  const isWithdrawDisabled = Boolean(
    claim.isSelling ||
      !withdrawAmount ||
      Number(withdrawAmount) > Number(token.balance) ||
      Number(withdrawAmount) <= 0
  );

  const handleBuyToken = async () => {
    if (typeof depositAmount === "number" && depositAmount > 0) {
      const txHash = await claim.buyHD(depositAmount.toString());
      if (!txHash) return;
      const userId = user?._id;
      if (!userId) {
        alert("Vui lòng đăng nhập lại");
        return;
      }
      const amountToken = Number(depositAmount) * Number(claim.rate);
      await deposit(userId, amountToken, txHash);
      setDepositAmount("");
      alert(`Đã mua ${amountToken} HD với ${depositAmount} ETH`);
      setReloadHistory((prev) => prev + 1);
    }
  };

  const handleWithdraw = async () => {
    if (typeof withdrawAmount === "number" && withdrawAmount > 0) {
      await token.approve(claim.contractAddress, withdrawAmount.toString());
      setTimeout(async () => {
        const txHash = await claim.sellHD(withdrawAmount.toString());
        if (!txHash) return;
        const userId = user?._id;
        if (!userId) return;
        const amountToken = Number(withdrawAmount) - Number(withdrawAmount) * 2;
        await deposit(userId, amountToken, txHash);
        setWithdrawAmount("");
        setReloadHistory((prev) => prev + 1);
      }, 8000);
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
      <RainAnimation obstacleSelector="#rain-obstacle" />
      <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-10 px-6 py-6">
        {/* WALLET SECTION - Minimalist B&W */}
        <div
          id="rain-obstacle"
          className="w-full rounded-[32px] border border-black bg-white p-8 relative z-10"
        >
          <h2 className="text-3xl font-bold text-black mb-8">Wallet</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Deposit & Withdraw */}
            <div className="space-y-6">
              {/* Deposit */}
              <div className="rounded-[24px] border border-black p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-black text-lg font-bold">↓</span>
                  </div>
                  <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                    Deposit
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-black/60 mb-2 block">
                      ETH Amount
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.001"
                      value={depositAmount}
                      onChange={(e) =>
                        setDepositAmount(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-full border border-black bg-white px-5 py-3 text-lg font-semibold focus:outline-none"
                    />
                  </div>
                  {claim.rate && depositAmount && (
                    <p className="text-sm text-black/60">
                      ≈{" "}
                      {(
                        Number(depositAmount) * Number(claim.rate)
                      ).toLocaleString()}{" "}
                      HD
                    </p>
                  )}
                  <Button
                    onClick={handleBuyToken}
                    disabled={isDepositDisabled || !isConnected}
                    className="w-full rounded-full border border-black bg-black text-white py-3 font-semibold uppercase tracking-wide hover:bg-black/90 disabled:opacity-50"
                  >
                    {claim.isBuying ? "Processing..." : "Buy HD"}
                  </Button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="rounded-[24px] border border-black p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center">
                    <span className="text-black text-lg font-bold">↑</span>
                  </div>
                  <h3 className="text-lg font-bold text-black uppercase tracking-wide">
                    Withdraw
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-black/60 mb-2 block">
                      HD Amount
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="100"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      className="w-full rounded-full border border-black bg-white px-5 py-3 text-lg font-semibold focus:outline-none"
                    />
                  </div>
                  {claim.rate && withdrawAmount && (
                    <p className="text-sm text-black/60">
                      ≈{" "}
                      {(Number(withdrawAmount) / Number(claim.rate)).toFixed(6)}{" "}
                      ETH
                    </p>
                  )}
                  <Button
                    onClick={handleWithdraw}
                    disabled={isWithdrawDisabled || !isConnected}
                    className="w-full rounded-full border border-black bg-white text-black py-3 font-semibold uppercase tracking-wide hover:bg-black/5 disabled:opacity-50"
                  >
                    {claim.isSelling ? "Processing..." : "Sell HD"}
                  </Button>
                </div>
              </div>

              {!isConnected && (
                <div className="rounded-full border border-black/30 px-5 py-3 text-center text-sm text-black/60">
                  Connect wallet to transact
                </div>
              )}
            </div>

            {/* RIGHT: Balance & History */}
            <div className="space-y-6">
              {/* Balance Card - Simple white background */}
              <div className="rounded-[24px] border border-black p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-black/60 mb-2">
                  Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-black">
                    {token.balance || "0"}
                  </span>
                  <span className="text-xl font-semibold text-black/60">
                    HD
                  </span>
                </div>
              </div>

              {/* Transaction History - No border wrapper */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-[0.3em] mb-4">
                  History
                </h3>
                <div className="max-h-[280px] overflow-y-auto space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-black/40 text-center py-6">
                      No transactions yet
                    </p>
                  ) : (
                    [...history].reverse().map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-2 py-3 border-b border-black/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center">
                            <span className="text-black text-sm font-bold">
                              {item.amount > 0 ? "↓" : "↑"}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-black">
                              {item.amount > 0 ? "+" : ""}
                              {item.amount} HD
                            </p>
                            <p className="text-xs text-black/40">
                              {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-black/40">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Votes Section với Polls từ API */}
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white rounded-[32px] border border-black p-8 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-8">
            <h2 className="text-2xl font-bold text-black tracking-tight">
              Active Votes
            </h2>
            <div className="flex gap-2">
              <Button
                className="text-sm rounded-full border border-black bg-black text-white hover:bg-black/90"
                onClick={() => refetch()}
                disabled={loadingPolls}
              >
                {loadingPolls ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Polls Loading State */}
          {loadingPolls && (
            <div className="w-full flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-black border-t-transparent mx-auto mb-4"></div>
                <p className="text-black/60 text-sm">Loading polls...</p>
              </div>
            </div>
          )}

          {/* Polls Error State */}
          {pollError && !loadingPolls && (
            <div className="w-full border border-black rounded-[20px] p-6 mb-8">
              <div className="text-black text-center">
                <p className="font-semibold">Error loading polls</p>
                <p className="text-sm mt-2 text-black/60">
                  {(pollError as Error).message || "Unknown error"}
                </p>
                <Button
                  onClick={() => refetch()}
                  className="mt-4 rounded-full border border-black bg-black text-white hover:bg-black/90"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Polls Grid */}
          {!loadingPolls && !pollError && (
            <div className="flex flex-wrap gap-6 w-full justify-center">
              {activePolls.length === 0 ? (
                <div className="w-full text-center py-12">
                  <p className="text-black/60 text-lg">No active polls found</p>
                  <p className="text-black/40 text-sm mt-2">
                    Check back later for new voting opportunities
                  </p>
                </div>
              ) : (
                activePolls.map((poll: Poll) => (
                  <Link
                    key={poll._id}
                    href={`/votes/${poll.onChainPollId}`}
                    className="group w-64 bg-white rounded-[20px] transition-all duration-200 hover:-translate-y-1 border border-black flex flex-col overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-black">
                      <h3 className="text-center font-semibold text-base text-black truncate uppercase tracking-wide">
                        {poll.title}
                      </h3>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2 flex-grow">
                      <p className="text-black/70 text-sm line-clamp-2 min-h-[2.5rem]">
                        {poll.description || "No description available"}
                      </p>
                      <div className="text-xs text-black/50 mt-auto space-y-1 pt-3 border-t border-black/10">
                        <div className="flex justify-between">
                          <span>Options</span>
                          <span className="font-medium text-black">
                            {poll.options.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span className="font-medium text-black capitalize">
                            {poll.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ends</span>
                          <span className="font-medium text-black">
                            {new Date(poll.endTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button className="mt-4 w-full rounded-full border border-black bg-black text-white text-xs uppercase tracking-wide hover:bg-black/90">
                        {poll.status === PollStatus.InProgress
                          ? "Vote Now"
                          : "View Poll"}
                      </Button>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
