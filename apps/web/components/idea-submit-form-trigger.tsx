"use client";

import * as React from "react";
import { Button } from "@sasvoth/ui/button";
import { IdeaUploadForm } from "@/components/idea-upload-form";
import { cn } from "@sasvoth/ui/lib/utils";

type IdeaSubmitFormTriggerProps = {
  className?: string;
  children: React.ReactNode;
};

export function IdeaSubmitFormTrigger({
  className,
  children,
}: IdeaSubmitFormTriggerProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <Button className={className} onClick={() => setIsOpen(true)}>
        {children}
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Idea submit form"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 z-10 text-xs font-semibold uppercase tracking-[0.3em] text-black/60 transition hover:text-black focus-visible:outline-none"
            >
              Close
            </button>
            <IdeaUploadForm
              className={cn(
                "max-h-[85vh] overflow-y-auto border border-black/20 bg-white",
                "shadow-[0_35px_120px_-60px_rgba(0,0,0,0.7)]"
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}
