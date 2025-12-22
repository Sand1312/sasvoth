"use client";

import * as React from "react";
import { Button } from "@sasvoth/ui/button";
import { IdeaUploadForm } from "@/components/idea-upload-form";
import { cn } from "@sasvoth/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sasvoth/ui/select";
import { useAccount } from "wagmi";
import { ideasApi } from "@/api/ideas.api";
import { usePolls } from "@/hooks/usePolls";
import { useFeedback } from "@/contexts/FeedbackContext";
import { Loader2, Plus, Check } from "lucide-react";

type IdeaSubmitFormTriggerProps = {
  className?: string;
  children: React.ReactNode;
  pollId: string;
};

type UserIdea = {
  _id: string;
  title: string;
  description: string;
  imgSrc?: string;
  createdAt?: string;
};

type ModalStep = "selection" | "new-idea";

export function IdeaSubmitFormTrigger({
  className,
  children,
  pollId,
}: IdeaSubmitFormTriggerProps): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState<ModalStep>("selection");
  const [userIdeas, setUserIdeas] = React.useState<UserIdea[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { address } = useAccount();
  const { addIdeaToPoll } = usePolls();
  const { showSuccess, showError } = useFeedback();

  // Fetch user's ideas when modal opens
  React.useEffect(() => {
    if (!isOpen || !address) return;

    const fetchUserIdeas = async () => {
      setIsLoading(true);
      try {
        const ideas = await ideasApi.getByUserAddress(address);
        setUserIdeas(Array.isArray(ideas) ? ideas : []);
      } catch (error) {
        console.error("Failed to fetch user ideas:", error);
        setUserIdeas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserIdeas();
  }, [isOpen, address]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setStep("selection");
      setSelectedIdeaId(null);
    }
  }, [isOpen]);

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

  const handleSelectExistingIdea = async () => {
    if (!selectedIdeaId || !pollId) return;

    setIsSubmitting(true);
    try {
      await addIdeaToPoll(pollId, selectedIdeaId);
      showSuccess(
        "Idea Added!",
        "Your idea has been successfully added to this poll."
      );
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to add idea to poll:", error);
      showError("Failed", error.message || "Could not add idea to poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewIdeaSuccess = () => {
    setIsOpen(false);
  };

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

            {step === "selection" && (
              <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-10 shadow-[0_35px_120px_-60px_rgba(0,0,0,0.7)]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                      Submit Your Idea
                    </p>
                    <h2 className="text-xl font-bold text-black">
                      Choose an existing idea or create a new one
                    </h2>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-black/40" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Existing Ideas Select Dropdown */}
                      {userIdeas.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-black/70">
                            Your existing ideas:
                          </p>
                          <Select
                            value={selectedIdeaId || ""}
                            onValueChange={(value) => setSelectedIdeaId(value)}
                          >
                            <SelectTrigger className="w-full border-black/20 text-black focus:border-black focus:ring-black/50">
                              <SelectValue placeholder="Select an existing idea" />
                            </SelectTrigger>
                            <SelectContent>
                              {userIdeas.map((idea) => (
                                <SelectItem key={idea._id} value={idea._id}>
                                  <div className="flex items-center gap-3">
                                    {idea.imgSrc && (
                                      <img
                                        src={idea.imgSrc}
                                        alt={idea.title}
                                        className="h-6 w-6 rounded-full object-cover"
                                      />
                                    )}
                                    <span>{idea.title}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Divider if there are existing ideas */}
                      {userIdeas.length > 0 && (
                        <div className="flex items-center gap-4 py-2">
                          <div className="h-px flex-1 bg-black/10" />
                          <span className="text-xs font-medium uppercase tracking-widest text-black/40">
                            or
                          </span>
                          <div className="h-px flex-1 bg-black/10" />
                        </div>
                      )}

                      {/* Create New Idea Button */}
                      <button
                        type="button"
                        onClick={() => setStep("new-idea")}
                        className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-black/20 p-6 text-black transition hover:border-black hover:bg-black/[0.02]"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="font-semibold">Create New Idea</span>
                      </button>

                      {/* Submit Selected Idea Button */}
                      {selectedIdeaId && (
                        <div className="pt-4">
                          <Button
                            onClick={handleSelectExistingIdea}
                            disabled={isSubmitting}
                            className="w-full rounded-full border border-black bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-black/90"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add Selected Idea"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "new-idea" && (
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setStep("selection")}
                  className="absolute left-6 top-6 z-10 text-xs font-semibold uppercase tracking-[0.3em] text-black/60 transition hover:text-black focus-visible:outline-none"
                >
                  ← Back
                </button>
                <IdeaUploadForm
                  className={cn(
                    "max-h-[85vh] overflow-y-auto border border-black/20 bg-white",
                    "shadow-[0_35px_120px_-60px_rgba(0,0,0,0.7)]"
                  )}
                  onSuccess={handleNewIdeaSuccess}
                  pollId={pollId}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

