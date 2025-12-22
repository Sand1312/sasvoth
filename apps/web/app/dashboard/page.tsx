import React, { Suspense } from "react";
import RainAnimation from "../../components/RainAnimation";
import { WalletSection } from "@/components/dashboard/WalletSection";
import { PollsSection } from "@/components/dashboard/PollsSection";

export const experimental_ppr = true;

function ComponentsSkeleton() {
  return (
    <div className="flex gap-8 items-start justify-center px-6 py-6 w-full max-w-6xl mx-auto mt-8">
      <div className="flex-1 w-full">
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

function WalletSkeleton() {
  return (
    <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-10 px-6 py-6">
       <div className="rounded-[30px] border border-black/10 bg-gray-50/50 p-8 shadow-lg h-[400px] animate-pulse relative z-10">
          <div className="h-10 w-1/3 bg-gray-200 rounded mb-8"></div>
          <div className="h-12 w-full bg-gray-200 rounded mb-4"></div>
          <div className="h-12 w-full bg-gray-200 rounded"></div>
       </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <>
      <RainAnimation obstacleSelector="#rain-obstacle" />
      
      {/* Wallet Section Stream */}
      <Suspense fallback={<WalletSkeleton />}>
        <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-10 px-6 py-6">
          <WalletSection />
        </div>
      </Suspense>

      {/* Polls Section Stream */}
      <Suspense fallback={<ComponentsSkeleton />}>
        <PollsSection />
      </Suspense>
    </>
  );
}
