import PollClient from "./PollClient";

export default async function PollPage({ params, searchParams }: {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<{ phase?: string }> | { phase?: string };
}) {

  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  return (
    <PollClient
      pollId={resolvedParams.id}
      searchParams={resolvedSearch}
    />
  );
}