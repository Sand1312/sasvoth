"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@sasvoth/ui/data-table";
import { columns, PollData } from "./columns";

interface PollsDataTableProps {
  polls: PollData[];
  page: number;
  limit: number;
  total: number;
  onPageChange?: (page: number) => void;
}

/**
 * Client component wrapper for DataTable that enables row click navigation.
 */
export function PollsDataTable({
  polls,
  page,
  limit,
  total,
  onPageChange,
}: PollsDataTableProps) {
  const router = useRouter();

  const handleRowClick = (poll: PollData) => {
    if (poll._id) {
      router.push(`/polls/${poll._id}`);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={polls}
      page={page}
      limit={limit}
      total={total}
      onRowClick={handleRowClick}
      onPageChange={onPageChange}
    />
  );
}
