"use client";

import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@sasvoth/ui/button";

type FeedbackType = "success" | "error";

interface FeedbackDialogProps {
  isOpen: boolean;
  type: FeedbackType;
  title: string;
  message: string;
  onClose: () => void;
}

export function FeedbackDialog({
  isOpen,
  type,
  title,
  message,
  onClose,
}: FeedbackDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-black bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`rounded-full p-4 ${
              isSuccess ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12" />
            ) : (
              <XCircle className="h-12 w-12" />
            )}
          </div>
          
          <h2 className={`text-2xl font-bold ${isSuccess ? "text-emerald-800" : "text-red-800"}`}>
            {title}
          </h2>
          
          <p className="text-gray-600">
            {message}
          </p>

          <Button 
            onClick={onClose}
            className={`mt-4 w-full rounded-full py-6 text-sm uppercase tracking-widest ${
                isSuccess 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isSuccess ? "Confirm" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
