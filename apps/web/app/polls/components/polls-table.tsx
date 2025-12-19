import { pollsApi } from "@/api";
import { DataTable } from "@sasvoth/ui/data-table";
import { columns, PollData } from "./columns";

interface PollsTableProps {
  page: number;
  limit: number;
  status?: string;
  activeAt?: Date;
  search?: string;
}

/**
 * Async Server Component that fetches and renders the polls table.
 * Used with Suspense for streaming.
 */
export async function PollsTable({
  page,
  limit,
  status,
  activeAt,
  search,
}: PollsTableProps) {
  // Server-side data fetching
  const response = await pollsApi.getPollsPaginated({
    page,
    limit,
    status,
    activeAt,
    search,
  });

  const polls = response.polls ?? [];
  const total = response.total ?? 0;

  if (polls.length === 0 && page === 1) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold">No polls available yet.</p>
        <p className="mt-2 text-sm text-black/60">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={polls as PollData[]}
      page={page}
      limit={limit}
      total={total}
    />
  );
}
