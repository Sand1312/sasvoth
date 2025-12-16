import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Username or email is required")
    .trim()
    .min(3, "Min 3 characters")
    .max(255, "Max 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters") // Server check chặt hơn
    .max(128),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export type ActionState = {
  success: boolean;
  message?: string;
  errors?: {
    [K in keyof LoginFormData]?: string[];
  };
  timestamp?: number; // Force re-render if needed
};
