"use client";

import { Button } from "@sasvoth/ui/button";
import { useMemo, useState } from "react";

export type Idea = {
  id: string;
  title: string;
  description: string;
  descriptionMore?: string | string[];
  imgSrc?: string;
  imgsSrc?: string[];
  creatorAddress?: string;
  creatorIdea?: string;
  idea_cid?: string;
};

type IdeaPageClientProps = {
  idea: Idea;
};

function ScreenshotGallery({
  images,
  activeIndex,
  onChange,
}: {
  images: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  // Top thumbnails: first 4 images
  const topThumbs = images.slice(0, 4);
  // Bottom grid: remaining images
  const bottomGrid = images.slice(4);

  return (
    <div className="w-full flex flex-col items-center bg-white text-black mt-8 py-6 rounded-xl border border-black">
      {/* Top Thumbnails */}
      <div className="flex gap-4 mb-4">
        {topThumbs.map((src, idx) => (
          <button
            key={src}
            onClick={() => onChange(idx)}
            className={`overflow-hidden rounded-lg border-2 transition-all duration-150 ${
              activeIndex === idx
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
          src={images[activeIndex]}
          alt={`Main screenshot ${activeIndex + 1}`}
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
              alt={`Extra screenshot ${idx + topThumbs.length + 1}`}
              className="object-cover w-full h-full grayscale transition-transform duration-150 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeaPageClient({ idea }: IdeaPageClientProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const descriptionLines = useMemo(() => {
    if (!idea.descriptionMore) return [];
    if (Array.isArray(idea.descriptionMore)) return idea.descriptionMore;
    return [idea.descriptionMore];
  }, [idea.descriptionMore]);

  const galleryImages = useMemo(() => {
    const uniqueSources = [
      ...(idea.imgsSrc ?? []),
      ...(idea.imgSrc ? [idea.imgSrc] : []),
    ].filter(Boolean);
    if (uniqueSources.length === 0) {
      return ["/screenshots/placeholder.jpg"];
    }
    return Array.from(new Set(uniqueSources));
  }, [idea.imgSrc, idea.imgsSrc]);

  const goPrevious = () => {
    setActiveImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  };

  const goNext = () => {
    setActiveImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">{idea.title}</h1>
      <div className="min-h-screen w-full flex flex-col md:flex-row gap-8 rounded-lg">
        {/* Left side: */}
        <section className="md:w-2/3 w-full flex flex-col items-center justify-start p-6 overflow-y-auto max-h-[90vh]">
          <div className="w-full aspect-video border border-black rounded-xl flex items-center justify-center mb-6 overflow-hidden">
            {galleryImages[activeImageIndex] ? (
              <img
                src={galleryImages[activeImageIndex]}
                alt={`${idea.title} primary`}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-black text-lg">Trailer / Screenshot</span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full justify-center">
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Previous"
              onClick={goPrevious}
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
              {galleryImages.slice(0, 5).map((src, idx) => (
                <div
                  key={src}
                  className="w-20 h-14 border border-black rounded-lg overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="rounded-full p-2 text-black hover:bg-gray-100"
              aria-label="Next"
              onClick={goNext}
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
          <ScreenshotGallery
            images={galleryImages}
            activeIndex={activeImageIndex}
            onChange={setActiveImageIndex}
          />
        </section>

        {/* Right side: */}
        <section className="md:w-1/3 w-full flex flex-col gap-6 p-6 border border-black rounded-xl">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">{idea.title}</h2>
            <div className="flex gap-8 border-b border-black mb-4">
              <button className="pb-2 text-black font-semibold border-b-2 border-black">
                Overview
              </button>
              <button className="pb-2 text-black hover:underline transition-colors">
                Achievements
              </button>
            </div>
          </div>
          <div className="w-32 h-32 border border-black rounded-lg overflow-hidden flex items-center justify-center mb-4">
            {idea.imgSrc ? (
              <img
                src={idea.imgSrc}
                alt={`${idea.title} logo`}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-black text-sm">Logo</span>
            )}
          </div>
          <div className="text-black text-sm leading-relaxed whitespace-pre-line">
            {idea.description}
          </div>
          {descriptionLines.length > 0 && (
            <ul className="list-disc list-inside text-black text-sm space-y-2">
              {descriptionLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="border border-black rounded-md px-3 py-1 text-black font-bold text-lg">
              Creator
            </div>
            <span className="text-black text-sm">
              {idea.creatorIdea || idea.creatorAddress || "Unknown"}
            </span>
          </div>
          <div className="text-black text-xs uppercase tracking-wider mb-1">
            Idea CID
          </div>
          <div className="text-sm font-mono text-black mb-4 break-all">
            {idea.idea_cid || "N/A"}
          </div>
          <div className="flex flex-col gap-3">
            <Button className="border border-black text-black font-bold text-lg py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Support Idea
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
