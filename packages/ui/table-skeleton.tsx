"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface TableSkeletonProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  rowCount?: number;
}

export function TableSkeleton<TData, TValue>({
  columns,
  rowCount = 10,
}: TableSkeletonProps<TData, TValue>) {
  // We use useReactTable just to get the header groups logic for consistent rendering
  // An empty data array is fine since we only care about headers here
  const table = useReactTable({
    data: [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-black/10 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-black/10 bg-gray-50/50">
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-row-${rowIndex}`} className="border-black/5">
                {columns.map((column, colIndex) => (
                  <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`} className="py-4">
                    {/* 
                      We use a generic skeleton here. 
                      To make it "variable width" like real text, we can randomize or 
                      use a standard width. For now, full width or fixed height looks clean.
                      YouTube style often uses fixed height bars.
                    */}
                    <Skeleton className="h-4 w-full opacity-50" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Skeleton - matching DataTable footer */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
