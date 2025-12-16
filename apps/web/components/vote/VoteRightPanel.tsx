import React from "react";
import { Button } from "@sasvoth/ui/button";

export type VoteRightPanelProps = {
  title: string;
  description: string;
  creator: string;
  approvedAt: string | Date;
  ideaId?: string;
  logo?: string;
  ageLimit?: string;
  voteAmount?: number;
  onVote?: () => void;
  isPreview?: boolean;
};

const truncateMiddle = (str: string, maxLength: number) => {
  if (!str || str.length <= maxLength) return str;
  const start = str.slice(0, Math.ceil(maxLength / 2));
  const end = str.slice(-Math.floor(maxLength / 2));
  return `${start}...${end}`;
};

export function VoteRightPanel({
  title,
  description,
  creator,
  approvedAt,
  ideaId,
  logo,
  ageLimit,
  onVote,
  isPreview = false,
}: VoteRightPanelProps) {
  const approvedDate = new Date(approvedAt);

  return (
    <section className="md:w-1/3 w-full flex flex-col gap-6 p-6 border border-black rounded-xl h-fit">
      <div>
        <h2 className="text-3xl font-bold text-black mb-2">{title}</h2>
        <div className="flex gap-8 border-b border-black mb-4">
          <button className="pb-2 text-black font-semibold border-b-2 border-black">
            Overview
          </button>
          <button className="pb-2 text-black hover:underline transition-colors">
            Achievements
          </button>
        </div>
      </div>
      
      <div className="w-32 h-32 flex items-center justify-center mb-4 overflow-hidden relative mx-auto">
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-black text-sm">Logo</span>
        )}
      </div>

      <div className="text-black mb-4 flex flex-col gap-2">
        <p className="mb-2 italic text-lg leading-relaxed">"{description}"</p>
        <div className="space-y-1 mt-4">
          <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Creator
          </p>
          <p className="text-base font-mono font-medium">
            {truncateMiddle(creator, 20)}
          </p>

          <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mt-3">
            Approved At
          </p>
          <p className="text-base font-medium">
            {approvedDate.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <p className="text-sm font-bold uppercase tracking-wide text-gray-500 mt-3">
            Idea ID
          </p>
          <p className="text-base font-mono font-medium">
            {truncateMiddle(ideaId || "", 20)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="border border-black rounded-md px-3 py-1 text-black font-bold text-lg">
          {ageLimit ? `${ageLimit}+` : "18+"}
        </div>
        <span className="text-black text-sm">
          Extreme Violence, Strong Language
        </span>
      </div>

      {!isPreview && (
        <div className="flex flex-col gap-3">
          <Button
            onClick={onVote}
            className="border border-black text-black font-bold text-lg py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Vote
          </Button>
          <Button className="border border-black text-black font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors">
            Add To Pin
          </Button>
        </div>
      )}
    </section>
  );
}
