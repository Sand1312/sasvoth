export enum PollStatus {
  Prepare = "prepare",
  Ended = "ended",
  Cancelled = "cancelled",
  InProgress = "in_progress",
  Counting = "counting",
  Waiting = "waiting",
}

export interface Poll {
  _id: string;
  title: string;
  description: string;
  category: string;
  onChainPollId: number;
  status: PollStatus;
  startTime: string;
  endTime: string;
  options: {
    id: string;
    label: string;
    description?: string;
    imageUrl?: string;
  }[];
  createdBy: {
    _id: string;
    username: string;
  };
}
