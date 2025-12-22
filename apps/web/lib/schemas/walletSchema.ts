import { z } from "zod";

export const depositSchema = z.object({
  amount: z.number()
    .positive("Amount must be greater than 0")
    .min(0.001, "Minimum deposit is 0.001 ETH"),
});

export const withdrawSchema = (balance: number) => z.object({
  amount: z.number()
    .positive("Amount must be greater than 0")
    .max(balance, "Insufficient balance"),
});

export type DepositValues = z.infer<typeof depositSchema>;
export type WithdrawValues = z.infer<ReturnType<typeof withdrawSchema>>;
