import React from "react";

export function VoteDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row gap-8 rounded-lg">
      {children}
    </div>
  );
}

export function VoteLeftPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="md:w-2/3 w-full flex flex-col items-start justify-start p-6 overflow-y-auto max-h-[90vh] gap-8">
      {children}
    </section>
  );
}

export function VoteTextBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="w-full text-black">
      <h3 className="text-2xl font-bold uppercase tracking-wide mb-4">{title}</h3>
      <div className="text-lg leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
