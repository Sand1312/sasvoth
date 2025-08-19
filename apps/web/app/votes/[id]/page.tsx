"use client";
import { Button } from "@sasvoth/ui/button";
import { notFound } from "next/navigation";
import React, { useState } from "react";

type Props = {
  params: { id: string };
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

  // Top thumbnails: first 4 images
  const topThumbs = screenshots.slice(0, 4);
  // Bottom grid: remaining images
  const bottomGrid = screenshots.slice(4);

  return (
    <div className="w-full flex flex-col items-center bg-white text-black mt-8 py-6 rounded-xl border border-black">
      {/* Top Thumbnails */}
      <div className="flex gap-4 mb-4">
        {topThumbs.map((src, idx) => (
          <button
            key={src}
            onClick={() => setMainIndex(idx)}
            className={`overflow-hidden rounded-lg border-2 transition-all duration-150 ${
              mainIndex === idx
                ? "border-black"
                : "border-transparent hover:border-black"
            }`}
            style={{ width: 72, height: 48 }}
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
  const { id } = params;
  const validIds = ["1", "2", "3", "4", "5", "6"];
  if (!validIds.includes(id)) {
    notFound();
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Vote #{id}</h1>
      <div className="min-h-screen w-full flex flex-col md:flex-row gap-8 rounded-lg">
        {/* Left side: */}
        <section className="md:w-2/3 w-full flex flex-col items-center justify-start p-6 overflow-y-auto max-h-[90vh]">
          <div className="w-full aspect-video border border-black rounded-xl flex items-center justify-center mb-6">
            <span className="text-black text-lg">Trailer / Screenshot</span>
          </div>
          <div className="flex items-center gap-2 w-full justify-center">
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Previous"
            >
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

        {/* Right side: */}
        <section className="md:w-1/3 w-full flex flex-col gap-6 p-6 border border-black rounded-xl">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Title</h2>
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
