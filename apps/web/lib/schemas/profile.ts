import { z } from "zod";

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less")
    .trim(),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      },
      { message: "Invalid date of birth" },
    ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export type ProfileActionState = {
  success: boolean;
  message?: string;
  errors?: {
    [K in keyof ProfileFormData]?: string[];
  };
};
