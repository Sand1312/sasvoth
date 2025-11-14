import { z } from 'zod';
import { PollStatus } from '../enums/poll-status.enum';

export const getPollsQuerySchema = z.object({
  status: z.nativeEnum(PollStatus).optional(),
});

export type GetPollsQueryDto = z.infer<typeof getPollsQuerySchema>;
