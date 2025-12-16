import React, { useState } from "react";
import { Button } from "@sasvoth/ui/button";

export type VoteGalleryProps = {
  heroImage?: string;
  screenshots?: string[];
  isPreview?: boolean;
  urlResolver?: (path: string) => string;
};

// Default dummy screenshots if none provided (matching existing behavior)
const defaultScreenshots = [
  "/screenshots/1.jpg",
  "/screenshots/2.jpg",
  "/screenshots/3.jpg",
  "/screenshots/4.jpg",
  "/screenshots/5.jpg",
  "/screenshots/6.jpg",
  "/screenshots/7.jpg",
  "/screenshots/8.jpg",
];

export function VoteGallery({
  heroImage,
  screenshots,
  isPreview = false,
  urlResolver
}: VoteGalleryProps) {
  const [mainIndex, setMainIndex] = useState(0);

  // If screenshots is NOT undefined, use it (even if empty).
  // If undefined, use defaultScreenshots.
  const displayScreenshots = screenshots !== undefined ? screenshots : defaultScreenshots;

  const topThumbs = displayScreenshots.slice(0, 4);
  const bottomGrid = displayScreenshots.slice(4);

  return (
    <div className="w-full flex flex-col items-center justify-start overflow-y-auto">
      {/* Hero Image Section */}
      {/* Only show hero wrapper if we have a hero image, OR if we are showing the placeholder 
          (which typically happens if NO gallery and NO hero provided? or just usually?)
          User asked to remove "display that has nothing".
          If heroImage is provided, show it.
      */}
      {heroImage ? (
        <div className="w-full aspect-video border border-black rounded-xl flex items-center justify-center mb-6 overflow-hidden">
             <img
               src={heroImage}
               alt="Trailer / Screenshot"
               className="w-full h-full object-cover"
             />
        </div>
      ) : (
        /* If no hero image, do we show placeholder? 
           User: "m bỏ cái hiển thị chẳng có ảnh gì đi" -> Remove display with no image.
           So if no heroImage, render nothing here? nothing.
        */
        null
      )}

      {/* Screenshot Gallery Section - ONLY render if we have screenshots */}
      {displayScreenshots.length > 0 && (
        <>
          <div className="h-4" />
          <div className="w-full flex flex-col items-center bg-white text-black py-6 rounded-xl border border-black">
            {/* Top Thumbnails */}
            <div className="flex gap-4 mb-4 flex-wrap justify-center">
              {topThumbs.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainIndex(idx)}
                  className={`overflow-hidden rounded-lg border-2 transition-all duration-150 w-[72px] h-[48px] ${
                    mainIndex === idx
                      ? "border-black"
                      : "border-transparent hover:border-black"
                  }`}
                  type="button"
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

            {/* Main Preview from Gallery */}
            <div className="w-full max-w-2xl aspect-video mb-6 rounded-2xl border-4 border-black bg-white flex items-center justify-center overflow-hidden p-1">
              {displayScreenshots[mainIndex] ? (
                <img
                    src={displayScreenshots[mainIndex]}
                    alt={`Main screenshot ${mainIndex + 1}`}
                    className="object-cover w-full h-full grayscale"
                />
              ) : (
                <span className="text-gray-400">No Image</span>
              )}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
              {bottomGrid.map((src, idx) => (
                <div
                  key={idx}
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
        </>
      )}
    </div>
  );
}
