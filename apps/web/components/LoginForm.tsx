"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sasvoth/ui/button";
import { Input } from "@sasvoth/ui/input";

export interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

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



export function LoginForm({
  onSubmit,
  isSubmitting,
  error,
}: LoginFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data.identifier, data.password);
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
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {error}
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
