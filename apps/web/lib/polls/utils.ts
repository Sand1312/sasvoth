import { PollStatus } from "@/types/polls";

/**
 * Pure function to derive the status of a poll based on its timing and on-chain state.
 * @param poll The poll object containing start/end time and on-chain ID.
 * @returns The calculated PollStatus.
 */
export function derivePollStatus(poll: {
  startTime?: string | Date;
  endTime?: string | Date;
  pollIdOnChain?: string | number;
  status?: PollStatus;
  timeframe?: { start: string; end: string };
}): PollStatus {
  // If explicitly set in DB to something final, verify consistency
  // But generally we rely on time checks for deployed polls.

  const timeframeStart =
    (typeof poll.startTime === "string"
      ? poll.startTime
      : poll.startTime?.toString()) ?? poll.timeframe?.start;
  const timeframeEnd =
    (typeof poll.endTime === "string"
      ? poll.endTime
      : poll.endTime?.toString()) ?? poll.timeframe?.end;

  const now = new Date();
  const start = timeframeStart ? new Date(timeframeStart) : new Date();
  const end = timeframeEnd ? new Date(timeframeEnd) : new Date();

  const isValidDate = (d: Date) => !isNaN(d.getTime());
  const startDate = isValidDate(start) ? start : new Date();
  const endDate = isValidDate(end) ? end : new Date();

  // Check if deployed on-chain
  const isDeployed =
    poll.pollIdOnChain !== undefined &&
    poll.pollIdOnChain !== null &&
    poll.pollIdOnChain !== "" &&
    poll.pollIdOnChain !== "0" && // Often initialized to "0" or 0
    poll.pollIdOnChain !== 0;

  if (isDeployed) {
    if (now < startDate) {
      return PollStatus.Prepare; // Waiting for start
    } else if (now >= startDate && now <= endDate) {
      return PollStatus.InProgress;
    } else {
      return PollStatus.Ended;
    }
  } else {
    // Not deployed
    if (now > startDate) {
      // Should have been deployed by now, or is just late?
      // Logic from PollClient implies if not deployed but time passes, it might be Cancelled or still Prepare.
      // Let's stick to Prepare or potentially Cancelled if way past?
      // For now, mirroring old logic:
      return PollStatus.Cancelled;
    } else {
      return PollStatus.Prepare;
    }
  }
}
