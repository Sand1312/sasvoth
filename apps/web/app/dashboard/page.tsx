"use client";
import { Button } from "@sasvoth/ui/button";
import React, { useState } from "react";

type Move = {
  id: number;
  to: string;
  amount: number;
};

type Notification = {
  id: number;
  message: string;
  date: string;
};

const mockMoves: Move[] = [
  { id: 1, to: "Alice", amount: 120 },
  { id: 2, to: "Bob", amount: 75 },
  { id: 3, to: "Charlie", amount: 200 },
  { id: 4, to: "Diana", amount: 50 },
];

const mockNotifications: Notification[] = [
  { id: 1, message: "Balance updated: +$120", date: "2024-06-10" },
  { id: 2, message: "Balance updated: -$75", date: "2024-06-09" },
  { id: 3, message: "Balance updated: +$200", date: "2024-06-08" },
  { id: 4, message: "Balance updated: -$50", date: "2024-06-07" },
];

export default function DashboardPage() {
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  const toggleHidden = (id: number) => {
    setHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((hid) => hid !== id) : [...prev, id]
    );
  };

  // Date
  const movesWithDate = mockMoves.map((move, idx) => ({
    ...move,
    date: mockNotifications[idx]?.date ?? "2024-06-01",
  }));

  const sortedMoves = [...movesWithDate].sort((a, b) => {
    if (sortBy === "amount") {
      return b.amount - a.amount;
    } else {
      // Sort by date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <>
      <div className="flex gap-8 mt-8 items-start justify-center px-6 py-6">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Vote</h2>
            <div />
            <div className="flex gap-2">
              <button
                className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                onClick={() => {
                  setSortBy((prev) => (prev === "date" ? "amount" : "date"));
                }}
              >
                Sort by {sortBy === "date" ? "Amount" : "Date"}
              </button>
              <button
                className="text-xs px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                onClick={() => {
                  if (hiddenIds.length === mockMoves.length) {
                    setHiddenIds([]);
                  } else {
                    setHiddenIds(mockMoves.map((move) => move.id));
                  }
                }}
              >
                {hiddenIds.length === mockMoves.length
                  ? "Show All"
                  : "Hide All"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sortedMoves.map((move) => (
              <div
                key={move.id}
                className="bg-white border rounded-lg shadow px-5 py-4 flex flex-col items-center justify-center"
              >
                <div className="text-base font-semibold mb-2">
                  {hiddenIds.includes(move.id) ? "****" : move.to}
                </div>
                <div className="text-lg font-bold">
                  {hiddenIds.includes(move.id) ? "****" : `$${move.amount}`}
                </div>
                <div className="text-xs text-slate-400 mb-1">{move.date}</div>
                <button
                  className="mt-2 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                  onClick={() => toggleHidden(move.id)}
                >
                  {hiddenIds.includes(move.id) ? "Show" : "Hide"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Notification Stack */}
        <div className="flex-1 flex flex-col items-end pr-8">
          <div className="w-full max-w-[340px] flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-4">Balance Notification</h2>
            {mockNotifications.slice(0, 3).map((notif) => (
              <div
                key={notif.id}
                className="bg-slate-50 rounded-lg px-5 py-4 shadow flex flex-col items-start"
              >
                <div className="font-semibold text-sm mb-1">
                  {notif.message.replace(/^Balance updated: /, "")}
                </div>
                <div className="text-xs text-slate-400">{notif.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-black p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-black mb-8 tracking-tight">
            Votes
          </h2>
          <div className="flex flex-wrap gap-8 w-full justify-center">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="w-64 bg-white rounded-xl shadow-md transition-transform duration-200 hover:-translate-y-2 hover:shadow-xl border border-black flex flex-col cursor-pointer"
                onClick={() => {
                  window.location.href = `/votes/${idx + 1}`;
                }}
                tabIndex={0}
                role="button"
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    window.location.href = `/votes/${idx + 1}`;
                  }
                }}
              >
                <div className="px-4 py-3 border-b border-black">
                  <h3 className="text-center font-semibold text-lg text-black">
                    Vote {idx + 1}
                  </h3>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2">
                  <p className="text-black text-sm">
                    The ballot is stronger than the bullet.
                  </p>
                  <p className="text-gray-500 text-xs">
                    No color, just clarity.
                  </p>
                  <Button
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/votes/${idx + 1}`;
                    }}
                  >
                    Open Vote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
