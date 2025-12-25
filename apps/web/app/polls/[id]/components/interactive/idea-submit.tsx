"use client";

import { IdeaSubmitFormTrigger } from "@/components/idea-submit-form-trigger";

export function IdeaSubmit({ pollId }: { pollId: string }) {
  return (
    <IdeaSubmitFormTrigger 
      className="rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black"
      pollId={pollId}
    >
      Submit your idea
    </IdeaSubmitFormTrigger>
  );
}
