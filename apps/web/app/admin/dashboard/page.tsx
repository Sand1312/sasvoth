"use client";

import { pollsApi } from "@/api/polls.api";
import { api } from "@/api/base";
import React, { useEffect, useState, useMemo } from "react";
import { PollStatus } from "@/types/polls";
import { Button } from "@sasvoth/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@sasvoth/ui/tabs";
import { Empty, EmptyTitle, EmptyDescription } from "@sasvoth/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sasvoth/ui/select";
import { Card } from "@sasvoth/ui/card";
import { DataTable } from "@sasvoth/ui/data-table";
import { RefreshButton } from "@sasvoth/ui/refresh-button";
import { IdeaUploadForm } from "@/components/idea-upload-form";
import { useClaimContract } from "@/hooks/useClaimContract";
import { useToken } from "@/hooks/useToken";
import { useAccount } from "wagmi";
import { CLAIM_CONTRACT_ADDRESS } from "@sasvoth/contracts";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

// Types
type User = {
  _id: string;
  walletAddress?: string;
  email?: string;
  displayName?: string;
  createdAt: string;
};

type Poll = {
  _id: string;
  title: string;
  status: string;
  startTime: string;
  endTime: string;
};

// Block explorer URL (Sepolia for testnet)
const BLOCK_EXPLORER_URL = "https://sepolia.etherscan.io";

// User table columns
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "displayName",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-black">
        {row.original.displayName || row.original.email?.split("@")[0] || "—"}
      </span>
    ),
  },
  {
    accessorKey: "walletAddress",
    header: "Wallet",
    cell: ({ row }) => {
      const wallet = row.original.walletAddress;
      if (!wallet) return <span className="text-black/40">—</span>;
      return (
        <a
          href={`${BLOCK_EXPLORER_URL}/address/${wallet}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-black/60 hover:text-black hover:underline"
        >
          {`${wallet.slice(0, 6)}...${wallet.slice(-4)}`}
        </a>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-black/70">{row.original.email || "—"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) return <span className="text-black/40">—</span>;
      const date = new Date(createdAt);
      if (isNaN(date.getTime()))
        return <span className="text-black/40">—</span>;
      return (
        <span className="text-xs text-black/50">
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
  },
];

export default function AdminDashboardPage(): React.ReactElement {
  const [sortBy, setSortBy] = useState<"end" | "start" | "votes" | "title">(
    "end",
  );
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const { withdrawETH, withdrawToken, isWithdrawingETH, isWithdrawingToken } =
    useClaimContract();
  const { transfer, isTransferring, balance, contractBalance } = useToken();
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  // Stats state
  const [userStats, setUserStats] = useState({ total: 0, today: 0 });
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [inProgressPolls, setInProgressPolls] = useState<Poll[]>([]);

  // Users table state
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const USERS_PER_PAGE = 20;

  // Withdraw handlers
  const handleWithdrawETH = async () => {
    if (!address) {
      alert("Please connect wallet first!");
      return;
    }
    setWithdrawing(true);
    setWithdrawSuccess(null);
    setWithdrawError(null);
    try {
      const hash = await withdrawETH();
      if (hash) {
        setWithdrawSuccess(`ETH withdrawn! Tx: ${hash.slice(0, 10)}...`);
      }
    } catch (error: any) {
      setWithdrawError(error.message || "Failed to withdraw ETH");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawToken = async () => {
    if (!address) {
      alert("Please connect wallet first!");
      return;
    }
    setWithdrawing(true);
    setWithdrawSuccess(null);
    setWithdrawError(null);
    try {
      const hash = await withdrawToken();
      if (hash) {
        setWithdrawSuccess(`Tokens withdrawn! Tx: ${hash.slice(0, 10)}...`);
      }
    } catch (error: any) {
      setWithdrawError(error.message || "Failed to withdraw tokens");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDepositToken = async () => {
    if (!address) {
      alert("Please connect wallet first!");
      return;
    }
    if (!depositAmount || Number(depositAmount) <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }
    setWithdrawing(true);
    setWithdrawSuccess(null);
    setWithdrawError(null);
    try {
      const hash = await transfer(CLAIM_CONTRACT_ADDRESS, depositAmount);
      if (hash) {
        setWithdrawSuccess(
          `Deposited ${depositAmount} HD tokens! Tx: ${hash.slice(0, 10)}...`,
        );
        setDepositAmount("");
      }
    } catch (error: any) {
      setWithdrawError(error.message || "Failed to deposit tokens");
    } finally {
      setWithdrawing(false);
    }
  };

  // Fetch users with pagination
  const fetchUsers = async (page: number) => {
    try {
      const response = await api.get(
        `/users?page=${page}&limit=${USERS_PER_PAGE}`,
      );
      const data = response.data;
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
      setUsersPage(data.page || page);

      // Use todaySignups from server (calculated from DB)
      setUserStats({
        total: data.total || 0,
        today: data.todaySignups || 0,
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch polls
        const polls = await pollsApi.getAll();
        setAllPolls(polls);
        setInProgressPolls(
          polls.filter((p: Poll) => p.status === PollStatus.InProgress),
        );

        // Fetch users (page 1)
        await fetchUsers(1);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle page change for users table (server-side pagination)
  const handleUsersPageChange = (newPage: number) => {
    fetchUsers(newPage);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const openedThisWeek = allPolls.filter((p) => {
      const startTime = new Date(p.startTime);
      return startTime >= startOfWeek && p.status === PollStatus.InProgress;
    }).length;

    const activePolls = inProgressPolls.length;

    // Monthly data for sparkline
    const monthlyData: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = allPolls.filter((p) => {
        const startTime = new Date(p.startTime);
        return startTime >= monthStart && startTime <= monthEnd;
      }).length;
      monthlyData.push(count);
    }

    return { openedThisWeek, activePolls, monthlyData };
  }, [allPolls, inProgressPolls]);

  // Format time for display
  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 24 ? `${Math.floor(hours / 24)}d ago` : `${hours}h ago`;
  };

  const formatDuration = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : "Ended";
  };

  return (
    <main className="min-h-screen bg-white text-black font-sans mx-auto w-full max-w-7xl px-6 py-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-1">
            Admin
          </p>
          <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        </div>
      </header>

      {/* Fund Management */}
      <section className="mb-8 border border-black/10 bg-white">
        <div className="border-b border-black/10 p-6">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-1">
            Admin
          </p>
          <h2 className="text-xl font-medium tracking-tight text-black">
            Fund Management
          </h2>
        </div>

        <div className="p-6">
          {withdrawSuccess && (
            <div className="mb-4 p-4 border border-black/20 bg-white text-black text-sm">
              {withdrawSuccess}
            </div>
          )}

          {withdrawError && (
            <div className="mb-4 p-4 border border-black bg-white text-black text-sm">
              {withdrawError}
            </div>
          )}

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="w-full bg-black/5 rounded-none border border-black/10 p-0 h-auto">
              <TabsTrigger
                value="deposit"
                className="flex-1 py-3 rounded-none border-0 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-black/60"
              >
                Deposit Tokens
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="flex-1 py-3 rounded-none border-0 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:text-black/60"
              >
                Withdraw Funds
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="mt-6">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Your Balance</span>
                  <span className="font-medium text-black">{balance} HD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Contract Balance</span>
                  <span className="font-medium text-black">
                    {contractBalance} HD
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount to deposit"
                  className="w-full px-4 py-3 border border-black/20 bg-white text-black placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
                />
                <Button
                  onClick={handleDepositToken}
                  disabled={
                    withdrawing || isTransferring || !address || !depositAmount
                  }
                  className="w-full bg-black text-white hover:bg-white hover:text-black border border-black transition-colors rounded-none py-3 font-medium disabled:opacity-40"
                >
                  {isTransferring ? "Depositing..." : "Deposit HD Tokens"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
              <div className="space-y-3">
                <Button
                  onClick={handleWithdrawETH}
                  disabled={withdrawing || isWithdrawingETH || !address}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white transition-colors rounded-none py-3 font-medium disabled:opacity-40"
                >
                  {isWithdrawingETH ? "Withdrawing..." : "Withdraw ETH"}
                </Button>

                <Button
                  onClick={handleWithdrawToken}
                  disabled={withdrawing || isWithdrawingToken || !address}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white transition-colors rounded-none py-3 font-medium disabled:opacity-40"
                >
                  {isWithdrawingToken ? "Withdrawing..." : "Withdraw HD Tokens"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {!address && (
            <p className="mt-4 text-sm text-black/50 text-center">
              Please connect your wallet to manage funds
            </p>
          )}
        </div>
      </section>

      {/* Opening Polls */}
      <section className="mb-8 border border-black/10 bg-white">
        <div className="border-b border-black/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-1">
                Live
              </p>
              <h2 className="text-xl font-medium tracking-tight text-black">
                Opening Polls
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as typeof sortBy)}
              >
                <SelectTrigger className="w-32 border-black/20 bg-white text-black rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="end">End Date</SelectItem>
                  <SelectItem value="start">Start Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              <RefreshButton
                onClick={() => {
                  setLoading(true);
                  pollsApi
                    .getAll()
                    .then((polls) => {
                      setAllPolls(polls);
                      setInProgressPolls(
                        polls.filter(
                          (p: Poll) => p.status === PollStatus.InProgress,
                        ),
                      );
                    })
                    .finally(() => setLoading(false));
                }}
                loading={loading}
                variant="outline"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {inProgressPolls.length === 0 ? (
            <Empty className="border border-black/10">
              <EmptyTitle className="text-black">No active polls</EmptyTitle>
              <EmptyDescription className="text-black/50">
                There are no polls currently in progress
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="space-y-px bg-black/10">
              {inProgressPolls.slice(0, 5).map((poll) => (
                <Link
                  key={poll._id}
                  href={`/polls/${poll._id}`}
                  className="block p-4 bg-white hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-black">
                        {poll.title}
                      </div>
                      <div className="text-xs text-black/50 mt-1">
                        {formatTimeAgo(poll.startTime)} · ends in{" "}
                        {formatDuration(poll.endTime)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-4 gap-px bg-black/10 mb-8">
        <Card className="p-4 bg-white rounded-none shadow-none border-0">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/40 mb-3">
            Sign Ups (24h)
          </div>
          <div className="text-3xl font-medium text-black">
            {userStats.today}
          </div>
          <div className="text-sm text-black/50 mt-1">
            +{userStats.total} total users
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-none shadow-none border-0">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/40 mb-3">
            Active Polls
          </div>
          <div className="text-3xl font-medium text-black">
            {stats.activePolls}
          </div>
          <div className="text-sm text-black/50 mt-1">
            Currently in progress
          </div>
        </Card>

        <Card className="p-4 bg-white rounded-none shadow-none border-0">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/40 mb-3">
            Opened This Week
          </div>
          <div className="text-3xl font-medium text-black">
            {stats.openedThisWeek}
          </div>
          <div className="text-sm text-black/50 mt-1">Polls started</div>
        </Card>

        <Card className="p-4 bg-white rounded-none shadow-none border-0">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-black/40 mb-3">
            Year Trend
          </div>
          <MonthlySparkline data={stats.monthlyData} />
          <div className="text-sm text-black/50 mt-1">Polls per month</div>
        </Card>
      </section>

      {/* Users Table */}
      <section className="mb-8 border border-black/10 bg-white">
        <div className="border-b border-black/10 p-6">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-1">
            Users
          </p>
          <h2 className="text-xl font-medium tracking-tight text-black">
            All Users
          </h2>
        </div>

        <div className="p-6">
          <DataTable
            columns={userColumns}
            data={users}
            page={usersPage}
            limit={USERS_PER_PAGE}
            total={usersTotal}
            onPageChange={handleUsersPageChange}
          />
        </div>
      </section>

      {/* Idea Upload */}
      <section className="border border-black/10 bg-white p-6">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-black/40 mb-1">
            Idea Lab
          </p>
          <h3 className="text-xl font-medium tracking-tight text-black">
            Upload a new idea
          </h3>
          <p className="text-sm text-black/50 mt-2 max-w-2xl">
            Create and upload new ideas for polls and voting.
          </p>
        </div>
        <IdeaUploadForm pollId="" />
      </section>
    </main>
  );
}

/* Sparkline Component */
function MonthlySparkline({ data }: { data: number[] }) {
  const width = 120;
  const height = 36;
  const max = Math.max(...data, 1);
  const d = data
    .map((p, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (p / max) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
      <path
        d={d}
        stroke="black"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
