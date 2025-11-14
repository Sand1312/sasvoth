import { z } from "zod";
import { PollStatus } from "../enums/poll-status.enum";

const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const createPollSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  creatorAddress: z
    .string()
    .regex(ethereumAddressRegex, "Invalid Ethereum address"),
  status: z.nativeEnum(PollStatus),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  options: z.array(z.string().trim().min(1)).min(1),
});

export type CreatePollDto = z.infer<typeof createPollSchema>;
