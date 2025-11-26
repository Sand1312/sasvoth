"use client";
import { Button } from "@sasvoth/ui/button";
import React, { use, useEffect, useState } from "react";
import { useIPFS } from "@/hooks/useIPFS";
type Props = {
  params: { id: string }; // id = CID
};

type VoteData = {
  pollId: string;
  ideaId: string;
  title: string;
  description: string;
  creator: string;
  approvedAt: string;
};

const screenshots = [
  "/screenshots/1.jpg",
  "/screenshots/2.jpg",
  "/screenshots/3.jpg",
  "/screenshots/4.jpg",
  "/screenshots/5.jpg",
  "/screenshots/6.jpg",
  "/screenshots/7.jpg",
  "/screenshots/8.jpg",
];

function ScreenshotGallery() {
  const [mainIndex, setMainIndex] = useState(0);

  const topThumbs = screenshots.slice(0, 4);
  const bottomGrid = screenshots.slice(4);

  return (
    <div className="w-full flex flex-col items-center bg-white text-black mt-8 py-6 rounded-xl border border-black">
      {/* Top Thumbnails */}
      <div className="flex gap-4 mb-4">
        {topThumbs.map((src, idx) => (
          <button
            key={src}
            onClick={() => setMainIndex(idx)}
            className={`overflow-hidden rounded-lg border-2 transition-all duration-150 w-[72px] h-[48px] ${
              mainIndex === idx
                ? "border-black"
                : "border-transparent hover:border-black"
            }`}
            aria-label={`Show screenshot ${idx + 1}`}
          >
            <img
              src={src}
              alt={`Screenshot ${idx + 1}`}
              className="object-cover w-full h-full grayscale transition-transform duration-150 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Main Preview */}
      <div className="w-full max-w-2xl aspect-video mb-6 rounded-2xl border-4 border-black bg-white flex items-center justify-center overflow-hidden">
        <img
          src={screenshots[mainIndex]}
          alt={`Main screenshot ${mainIndex + 1}`}
          className="object-cover w-full h-full grayscale"
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {bottomGrid.map((src, idx) => (
          <div
            key={src}
            className="bg-white rounded-xl overflow-hidden border-2 border-black flex items-center justify-center aspect-video"
          >
            <img
              src={src}
              alt={`Extra screenshot ${idx + 5}`}
              className="object-cover w-full h-full grayscale transition-transform duration-150 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VotePage({ params }: Props) {
  const { id } = params; // id = CID từ URL

  const [data, setData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const res = await useIPFS().fetchMetadata(id);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json = (await res.json()) as VoteData;

        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Failed to load IPFS data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-black">Loading vote data from IPFS…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-4">
        <p className="text-red-600">
          Failed to load vote data from IPFS: {error ?? "Unknown error"}
        </p>
      </main>
    );
  }

  const approvedAt = new Date(data.approvedAt);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Vote #{data.pollId}</h1>
      <div className="min-h-screen w-full flex flex-col md:flex-row gap-8 rounded-lg">
        {/* Left side */}
        <section className="md:w-2/3 w-full flex flex-col items-center justify-start p-6 overflow-y-auto max-h-[90vh]">
          <div className="w-full aspect-video border border-black rounded-xl flex items-center justify-center mb-6">
            <span className="text-black text-lg">Trailer / Screenshot</span>
          </div>

          {/* (giữ UI cũ hoặc tua lại logic cho hợp) */}
          <div className="flex items-center gap-2 w-full justify-center">
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Previous"
            >
              {/* ... icon ... */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-20 h-14 border border-black rounded-lg flex items-center justify-center text-black text-xs font-semibold"
                >
                  Img {n}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Next"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>

          <div className="h-4" />
          <ScreenshotGallery />
        </section>

        {/* Right side */}
        <section className="md:w-1/3 w-full flex flex-col gap-6 p-6 border border-black rounded-xl">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">{data.title}</h2>
            <div className="flex gap-8 border-b border-black mb-4">
              <button className="pb-2 text-black font-semibold border-b-2 border-black">
                Overview
              </button>
              <button className="pb-2 text-black hover:underline transition-colors">
                Achievements
              </button>
            </div>
          </div>

          <div className="w-32 h-32 border border-black rounded-lg flex items-center justify-center mb-4">
            <span className="text-black text-sm">Logo</span>
          </div>

          <div className="text-black text-sm mb-2">
            <p className="mb-2">{data.description}</p>
            <p className="text-xs">
              Creator: <span className="font-mono">{data.creator}</span>
            </p>
            <p className="text-xs">
              Approved at:{" "}
              {approvedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <p className="text-xs">Idea ID: {data.ideaId}</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="border border-black rounded-md px-3 py-1 text-black font-bold text-lg">
              18+
            </div>
            <span className="text-black text-sm">
              Extreme Violence, Strong Language
            </span>
          </div>

          <div className="text-black text-xs uppercase tracking-wider mb-1">
            Base Game
          </div>
          <div className="text-2xl font-bold text-black mb-4">₫209,000</div>

          <div className="flex flex-col gap-3">
            <Button className="border border-black text-black font-bold text-lg py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Vote
            </Button>
            <Button className="border border-black text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Add To Pin
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
