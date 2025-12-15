import PollClient from "./PollClient";
import { PollProvider } from "./PollContext";
type PollPageProps = {
  params: Promise<{ pollId?: string; id?: string }>;
  searchParams: Promise<{ phase?: string }>;
};

export default async function PollPage(props: PollPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  return (
    <PollProvider>
      <PollClient searchParams={searchParams} />
    </PollProvider>
  );
}
