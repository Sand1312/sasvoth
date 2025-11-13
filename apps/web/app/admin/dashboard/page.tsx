"use client";
import React, { useState } from "react";
import { Button } from "@sasvoth/ui/button";
import { IdeaUploadForm } from "@/components/idea-upload-form";

type Vote = {
  id: string;
  title: string;
  openAt: string;
  endsIn: string;
  votes: number;
  description: string;
  whitelistApproved: string[];
};

const MOCK_VOTES: Vote[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `v-${i + 1}`,
  title: `Vote #${i + 1} - Proposal ${String.fromCharCode(65 + (i % 6))}`,
  openAt: `${i + 1}h ago`,
  endsIn: `${3 + (i % 5)}d`,
  votes: 20 + i * 5,
  description: "A short description of the vote, goals and scope.",
  whitelistApproved: ["alice", "bob", ...(i % 3 ? ["carol"] : [])],
}));

export default function AdminDashboardPage(): React.ReactElement {
  const [groupIndex, setGroupIndex] = useState(0); // groups of 3
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"end" | "start" | "votes" | "title">(
    "end"
  );
  const groupSize = 3;
  const groups = Math.ceil(MOCK_VOTES.length / groupSize);
  const currentGroup = MOCK_VOTES.slice(
    groupIndex * groupSize,
    groupIndex * groupSize + groupSize
  );

  const notificationCount = 4;
  const openingVotePercent = 72;
  const openingVoteETA = "2d 4h";

  return (
    <main className="min-h-screen bg-white text-black p-8 font-sans">
      <header className="flex items-start justify-between mb-8">
        <div>
          <div className="w-full flex justify-center">
            <h1 className="text-4xl font-extrabold ">Admin Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              aria-label="notifications"
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2zM18 16v-5c0-3.1-1.6-5.7-4.5-6.3V4a1.5 1.5 0 10-3 0v.7C7.6 5.3 6 7.9 6 11v5l-2 2v1h16v-1l-2-2z"
                  fill="currentColor"
                />
              </svg>
            </button>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-black text-xs font-medium rounded-full px-2">
                {notificationCount}
              </span>
            )}
          </div>

          <Button className="bg-black text-white rounded px-4 py-2" asChild>
            <a href="/admin/newvote">New Vote</a>
          </Button>
        </div>
      </header>

      {/* Progress of opening vote */}
      <section className="mb-8 border-t border-b border-gray-200 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Progress of Opening Vote</h2>

          {/* prettier, usable sort control */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={undefined}
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-2 text-sm px-3 py-1 border rounded bg-white shadow-sm"
            >
              <span>
                {
                  (
                    {
                      end: "End Date",
                      start: "Start Date",
                      votes: "Votes",
                      title: "Title",
                    } as Record<string, string>
                  )[sortBy]
                }
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-70"
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <ul
                role="listbox"
                className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-10"
              >
                {[
                  { key: "end", label: "Sort by: End Date" },
                  { key: "start", label: "Sort by: Start Date" },
                  { key: "votes", label: "Sort by: Votes" },
                  { key: "title", label: "Sort by: Title" },
                ].map((opt) => (
                  <li
                    key={opt.key}
                    role="option"
                    onClick={() => {
                      setSortBy(opt.key as typeof sortBy);
                      setMenuOpen(false);
                    }}
                    className={
                      "px-3 py-2 text-sm cursor-pointer hover:bg-black/5 " +
                      (sortBy === opt.key ? "font-medium bg-black/5" : "")
                    }
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {(() => {
            // small helpers to parse the mock strings
            const parseEndsIn = (s: string) => {
              // e.g. "3d"
              const d = parseInt(s.replace(/\D/g, ""), 10);
              return isNaN(d) ? 0 : d;
            };
            const parseOpenAt = (s: string) => {
              // e.g. "4h ago"
              const n = parseInt(s.replace(/\D/g, ""), 10);
              return isNaN(n) ? 0 : n;
            };

            const sorted = [...MOCK_VOTES].sort((a, b) => {
              if (sortBy === "end") {
                return parseEndsIn(a.endsIn) - parseEndsIn(b.endsIn);
              } else if (sortBy === "start") {
                return parseOpenAt(a.openAt) - parseOpenAt(b.openAt);
              } else if (sortBy === "votes") {
                return b.votes - a.votes;
              } else {
                return a.title.localeCompare(b.title);
              }
            });

            const maxVotes = Math.max(...MOCK_VOTES.map((v) => v.votes), 1);
            const displayed = sorted.slice(0, 3);

            return displayed.map((v) => {
              const pct = Math.round((v.votes / maxVotes) * 100);
              return (
                <div key={v.id} className="p-3 border rounded bg-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-gray-700">{v.title}</div>
                      <div className="text-xs text-gray-500">
                        {v.openAt} • {v.endsIn}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">{v.votes}</div>
                      <div className="text-xs text-gray-700">votes</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <div className="h-2 bg-black/10 rounded overflow-hidden">
                        <div
                          className="h-full bg-black transition-all duration-200"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-medium">{pct}%</div>
                      <div className="text-xs text-gray-700">
                        ETA {v.endsIn}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {/* Four cards row */}
      <section className="grid grid-cols-4 gap-4 mb-8">
        <Card title="Sign Ups (24h)">
          <Sparkline />
          <div className="text-sm mt-2">+128 new users</div>
        </Card>

        <Card title="Voting Today">
          <div className="text-3xl font-semibold">342</div>
          <div className="text-sm mt-2">Active voters</div>
        </Card>

        <Card title="Opened This Week">
          <div className="text-3xl font-semibold">12</div>
          <div className="text-sm mt-2">Votes opened</div>
        </Card>

        <Card title="Openings (Year)">
          <Sparkline long />
          <div className="text-sm mt-2">Trend over the year</div>
        </Card>
      </section>

      <section className="mb-12 grid grid-cols-5 gap-16">
        <div className="col-span-3">
          <h3 className="text-xl font-semibold mb-6">Your Open Votes</h3>

          <div className="flex flex-wrap gap-12">
            {currentGroup.map((v, i) => (
              <div
                key={v.id}
                className="relative w-80 h-[28rem] rounded-3xl border border-black/10 bg-white shadow-lg hover:shadow-2xl transition"
              >
                <div className="absolute top-6 left-6 text-sm text-gray-600">
                  {v.openAt} • ends in {v.endsIn}
                </div>

                <div className="absolute top-6 right-6 text-3xl font-bold text-gray-400">
                  {String.fromCharCode(65 + i)}
                </div>

                <h4 className="mt-16 px-6 text-center font-semibold text-lg">
                  {v.title}
                </h4>

                <p className="mt-5 px-6 text-base text-gray-700 overflow-hidden max-h-24">
                  {v.description}
                </p>

                <div className="absolute inset-x-6 bottom-6 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {v.whitelistApproved.slice(0, 3).map((u) => (
                      <div
                        key={u}
                        className="w-10 h-10 rounded-full bg-black text-white text-base flex items-center justify-center border-2 border-white"
                        title={u}
                      >
                        {u.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {v.whitelistApproved.length > 3 && (
                      <div className="w-10 h-10 rounded-full bg-black/10 text-black text-sm flex items-center justify-center">
                        +{v.whitelistApproved.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-bold leading-none">
                      {v.votes}
                    </div>
                    <div className="text-sm text-gray-600">votes</div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5" />
              </div>
            ))}
          </div>
        </div>

        <aside className="col-span-2">
          <div className="relative h-[30rem] w-80">
            {Array.from({ length: groups }).map((_, gi) => {
              const vote = MOCK_VOTES[gi * groupSize];
              if (!vote) return null;

              const active = gi === groupIndex;
              const offset = gi - groupIndex;
              const rotation = offset * 12; // larger fan angle
              const yOffset = gi * 28; // more vertical spacing
              const xOffset = offset * 28; // horizontal spread for better visibility
              const scale = active ? 1.08 : 0.98;
              const z = active ? 100 : 90 - Math.abs(offset) * 2 - gi;

              return (
                <div
                  key={gi}
                  onMouseEnter={() => setGroupIndex(gi)}
                  className={`absolute w-64 h-80 rounded-2xl border border-black/10 bg-white shadow-lg cursor-pointer transition-[transform,box-shadow] duration-300 ease-out ${
                    active
                      ? "ring-2 ring-black ring-offset-2"
                      : "hover:shadow-2xl"
                  }`}
                  style={{
                    transform: `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(${scale})`,
                    top: 0,
                    left: 0,
                    zIndex: z,
                  }}
                >
                  <div className="absolute top-4 right-4 text-3xl font-bold text-gray-400">
                    {String.fromCharCode(65 + gi)}
                  </div>

                  <div className="h-full p-5 flex flex-col">
                    <div className="text-sm text-gray-600">
                      {vote.openAt} • {vote.endsIn}
                    </div>
                    <div className="mt-2 text-lg font-medium overflow-hidden max-h-20">
                      {vote.title}
                    </div>
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex -space-x-2">
                        {vote.whitelistApproved.slice(0, 2).map((u) => (
                          <div
                            key={u}
                            className="w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center border-2 border-white"
                            title={u}
                          >
                            {u.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-700">
                        {vote.votes} votes
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      {/* Tracking list with 2 columns */}
      <section>
        <h3 className="text-lg font-medium mb-4">Tracking</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium mb-2">Vote open timeline</h5>
            <ul className="space-y-3">
              {MOCK_VOTES.slice(0, 6).map((v) => (
                <li key={v.id} className="p-3 border rounded">
                  <div className="text-xs text-gray-700">{v.openAt}</div>
                  <div className="font-medium">{v.title}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Whitelist approvals</h5>
            <ul className="space-y-3">
              {MOCK_VOTES.slice(0, 6).map((v) => (
                <li key={v.id} className="p-3 border rounded">
                  <div className="text-xs text-gray-700">{v.title}</div>
                  <div className="mt-1 flex gap-2">
                    {v.whitelistApproved.length ? (
                      v.whitelistApproved.map((u) => (
                        <span
                          key={u}
                          className="text-xs px-2 py-1 border rounded-full bg-black text-white"
                        >
                          {u}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-600">
                        No approvals yet
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex flex-col gap-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Idea lab
          </p>
          <h3 className="text-2xl font-semibold">Upload a new idea</h3>
          <p className="text-sm text-gray-700 max-w-2xl">
            Capture a concept with the same monochrome aesthetic from the
            reference mock. Logos keep the circular crop, age gates stay tight,
            and the second step mirrors the newsroom layout with an interactive
            preview modal.
          </p>
        </div>
        <IdeaUploadForm />
      </section>
    </main>
  );
}

/* Small presentational components below */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-sm text-gray-700 mb-3">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Sparkline({ long }: { long?: boolean } = { long: false }) {
  const points = long ? [2, 4, 3, 6, 5, 8, 7, 9, 6, 10] : [1, 3, 2, 4, 3, 5];
  const width = 120;
  const height = 36;
  const max = Math.max(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
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
