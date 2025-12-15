"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useFeedback } from "@/contexts/FeedbackContext";

// Zod validation schema for login form
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Username or email is required")
    .trim()
    .min(3, "Username or email must be at least 3 characters")
    .max(255, "Username or email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm(): React.ReactElement {
  const { showSuccess, showError } = useFeedback();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    // If error in URL
    if (searchParams?.get("error")) {
      showError("Login Error", "Authentication failed");
    }
  }, [searchParams, showError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onFormSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null); // Clear previous server errors
    try {
      // Simulate an API call for login
      // In a real application, you would call your authentication API here
      const response = await new Promise<{ error?: string }>((resolve) => {
        setTimeout(() => {
          if (data.identifier === "test" && data.password === "password") {
            resolve({}); // Simulate successful login
          } else {
            resolve({ error: "Invalid credentials" }); // Simulate failed login
          }
        }, 1500); // Simulate network delay
      });

      if (response?.error) {
        showError("Login Failed", "Invalid credentials");
        setServerError(response.error);
      } else {
        showSuccess("Welcome back", "Logged in successfully");
        // Decode in case it's double encoded, though router should handle it.
        // Basic check to ensure we don't redirect to external sites if not desired.
        // For now, assume relative or trusted paths.
        router.push(callbackUrl); 
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("Login Error", "An unexpected error occurred.");
      setServerError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
      <div>
        <Input
          type="text"
          placeholder="Username or Email"
          className="w-full"
          autoComplete="username"
          aria-label="Username or email address"
          aria-required="true"
          aria-invalid={!!errors.identifier}
          disabled={isSubmitting}
          {...register("identifier")}
        />
        {errors.identifier && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600 mt-1"
          >
            {errors.identifier.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Password"
          className="w-full"
          autoComplete="current-password"
          aria-label="Password"
          aria-required="true"
          aria-invalid={!!errors.password}
          disabled={isSubmitting}
          {...register("password")}
        />
        {errors.password && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-red-600 mt-1"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Display server error if present */}
      {serverError && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
