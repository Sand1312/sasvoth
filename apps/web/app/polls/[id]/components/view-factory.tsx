import { getPollById } from "@/lib/polls/service";
import { PollStatus } from "@/types/polls";
import { PrepareView } from "./views/prepare-view";
import { VotingView } from "./views/voting-view";
import { EndedView } from "./views/ended-view";

export async function PollViewFactory({ pollId }: { pollId: string }) {
  // Fetch full data (Server-side)
  const poll = await getPollById(pollId);

  // Strategy Pattern: Select View based on Status
  switch (poll.status) {
    case PollStatus.Prepare:
      return <PrepareView poll={poll} />;
      
    case PollStatus.InProgress:
      return <VotingView poll={poll} />;
      
    case PollStatus.Ended:
      return <EndedView poll={poll} />;
      
    case PollStatus.Waiting:
      // Deployed but waiting for start time
      return <PrepareView poll={poll} />;

    case PollStatus.Cancelled:
      // Reuse PrepareView, it handles cancelled state display
      return <PrepareView poll={poll} />;
      
    case PollStatus.Counting:
      // Use EndedView for counting state as it shows results pending message
      return <EndedView poll={poll} />;
      
    default:
      return <EndedView poll={poll} />;
  }
}
