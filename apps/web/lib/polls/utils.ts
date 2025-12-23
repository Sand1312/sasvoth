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

  const isDeployed =
    poll.pollIdOnChain !== undefined &&
    poll.pollIdOnChain !== null &&
    String(poll.pollIdOnChain) !== "";

  // If deployed, we prioritize the derived status over a stale "Cancelled" status
  // Otherwise, if explicitly statuses are set (locked), we respect them.
  
  // Admin forced end
  if (poll.status === PollStatus.Ended) {
    return PollStatus.Ended;
  }
  
  // Tallying in progress
  if (poll.status === PollStatus.Counting) {
    return PollStatus.Counting;
  }

  // Case 1: Deployed
  if (isDeployed) {
    if (now < startDate) {
      return PollStatus.Waiting; 
    } else if (now >= startDate && now <= endDate) {
      return PollStatus.InProgress;
    } else {
      // Past end date - poll.status must be explicitly "ended" (set by tally)
      // Since we already checked for Ended at line 41, if we reach here,
      // show "Counting" to indicate tally is pending
      return PollStatus.Counting; 
    }
  } 
  
  // Case 2: Not Deployed
  else {
    // Only respect manual/auto cancel if NOT deployed
    if (poll.status === PollStatus.Cancelled) {
        return PollStatus.Cancelled;
    }

    if (now < startDate) {
      return PollStatus.Prepare; 
    } else {
      return PollStatus.Cancelled;
    }
  }
}
