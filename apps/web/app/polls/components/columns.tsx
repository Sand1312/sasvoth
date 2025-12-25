"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@sasvoth/ui/button";
import { cn } from "@sasvoth/ui/lib/utils";

import { PollStatus } from "@/types/polls";
import { formatDate } from "@/lib/date";

// Poll data type matching the page
export type PollData = {
  _id?: string;
  title?: string;
  description?: string;
  status?: PollStatus;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
  onChainPollId?: number;
  participation?: ("joined" | "contributed")[];
};

// Status theme colors with high contrast
const statusThemes: Record<
  PollStatus,
  { accent: string; text: string }
> = {
  [PollStatus.Prepare]: {
    accent: "bg-emerald-500",
    text: "text-emerald-800",
  },
  [PollStatus.InProgress]: {
    accent: "bg-orange-500",
    text: "text-orange-800",
  },
  [PollStatus.Counting]: {
    accent: "bg-indigo-500",
    text: "text-indigo-800",
  },
  [PollStatus.Ended]: {
    accent: "bg-slate-500",
    text: "text-slate-800",
  },
  [PollStatus.Cancelled]: {
    accent: "bg-red-600",
    text: "text-red-800",
  },
  [PollStatus.Waiting]: {
    accent: "bg-sky-500",
    text: "text-sky-800",
  },
};

export const columns: ColumnDef<PollData>[] = [
  // Status indicator column (colored bar)
  {
    id: "statusBar",
    header: "",
    cell: ({ row }) => {
      const status = row.original.status ?? PollStatus.Prepare;
      const theme = statusThemes[status];
      return (
        <div
          className={cn("w-1 h-12 rounded-full", theme?.accent ?? "bg-gray-400")}
          aria-label={`Status: ${status}`}
        />
      );
    },
    size: 8,
    enableSorting: false,
    enableHiding: false,
  },
  // Poll name and description
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Poll
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="max-w-[300px]">
          <p className="font-semibold text-black truncate">{row.original.title}</p>
          <p className="text-sm text-black/60 truncate mt-1">
            {row.original.description}
          </p>
        </div>
      );
    },
  },
  // Timeline column - time on top of date
  {
    id: "timeline",
    header: "Timeline",
    cell: ({ row }) => {
      const start = row.original.startTime;
      const end = row.original.endTime;
      
      // Format: time on top, date below
      const formatDateTime = (dateStr: string | undefined) => {
        if (!dateStr) return { time: "--:--", date: "---" };
        const d = new Date(dateStr);
        return {
          time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
      };
      
      const startFormatted = formatDateTime(start);
      const endFormatted = formatDateTime(end);
      
      return (
        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-semibold text-black">{startFormatted.time}</p>
            <p className="text-xs text-black/50">{startFormatted.date}</p>
          </div>
          <span className="text-black/30">→</span>
          <div className="text-center">
            <p className="font-semibold text-black">{endFormatted.time}</p>
            <p className="text-xs text-black/50">{endFormatted.date}</p>
          </div>
        </div>
      );
    },
  },
  // Role column
  {
    id: "role",
    header: "Role",
    cell: ({ row }) => {
      const participation = row.original.participation ?? [];
      const isContributor = participation.includes("contributed");
      return (
        <span className={cn(
          "text-sm font-medium",
          isContributor ? "text-emerald-700" : "text-black/70"
        )}>
          {isContributor ? "Contributor" : "Member"}
        </span>
      );
    },
  },
  // Updated time column with sorting
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const updatedAt = row.original.updatedAt ?? row.original.endTime;
      return (
        <span className="text-sm text-black/60">
          {formatDate(updatedAt)}
        </span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.updatedAt ?? rowA.original.endTime ?? 0).getTime();
      const dateB = new Date(rowB.original.updatedAt ?? rowB.original.endTime ?? 0).getTime();
      return dateA - dateB;
    },
  },
];
