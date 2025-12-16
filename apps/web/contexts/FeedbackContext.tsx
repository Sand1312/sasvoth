"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { FeedbackDialog } from "@/components/feedback-dialog";

type FeedbackType = "success" | "error";

interface FeedbackData {
  type: FeedbackType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface FeedbackContextType {
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setFeedback({ type: "success", title, message, onConfirm });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setFeedback({ type: "error", title, message });
  }, []);

  const handleClose = () => {
    if (feedback?.type === "success" && feedback.onConfirm) {
      feedback.onConfirm();
    }
    setFeedback(null);
  };

  return (
    <FeedbackContext.Provider value={{ showSuccess, showError }}>
      {children}
      <FeedbackDialog
        isOpen={!!feedback}
        type={feedback?.type || "success"}
        title={feedback?.title || ""}
        message={feedback?.message || ""}
        onClose={handleClose}
      />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
