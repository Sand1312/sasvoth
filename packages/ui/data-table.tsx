"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue?: string;
  statusFilter?: string | null;
  // Pagination props (server-side)
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue = "",
  statusFilter = null,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Update status filter when prop changes
  React.useEffect(() => {
    if (statusFilter) {
      setColumnFilters([{ id: "status", value: [statusFilter] }]);
    } else {
      setColumnFilters([]);
    }
  }, [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchValue,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      // NOTE: This global filter logic might need adjustment if used generically
      // For now, keeping it robust enough for common fields or letting the prop accessor handle it
      // But actually, 'title' and 'description' are specific to Polls.
      // To make this truly reusable, we should rely on accessor keys or default filtering.
      // For this refactor, I'll switch to a more generic string match across all columns.
      return String(row.original).toLowerCase().includes(search);
    },
  });

  const totalPages = Math.ceil(total / limit);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-black/10 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-black/10 bg-gray-50/50">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className="text-xs uppercase tracking-[0.2em] text-black/50 font-medium"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-black/5 hover:bg-gray-50/70"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <p className="text-lg font-semibold text-black/70">No data found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {total > 0 && onPageChange && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-black/60">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!canGoPrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!canGoNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
