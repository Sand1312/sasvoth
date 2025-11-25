import PollClient from "./PollClient";
import { PollProvider } from "./PollContext";
type PollPageProps = {
  params: { pollId?: string; id?: string };
  searchParams?: { phase?: string };
};

export default function PollPage({ searchParams }: PollPageProps) {
  return (
    <PollProvider>
      <PollClient searchParams={searchParams} />
    </PollProvider>
  );
}
