"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./table";
import { Button } from "./button";
import { Pagination } from "./pagination";
import { TableSkeleton } from "./table-skeleton";
import type { PaginationMeta } from "@/types";

export type PaginationMode = "client" | "server";

export interface DataTableProps<TData, TValue> {
  /** Column definitions using TanStack Table ColumnDef */
  columns: ColumnDef<TData, TValue>[];
  /** Table data array */
  data: TData[];
  /** Pagination mode: "client" for local pagination, "server" for API-driven */
  paginationMode?: PaginationMode;
  /** Server pagination metadata (required when paginationMode="server") */
  serverPagination?: PaginationMeta;
  /** Callback when page changes (required when paginationMode="server") */
  onPageChange?: (page: number) => void;
  /** Callback when rows per page changes (server mode - enables the selector) */
  onLimitChange?: (limit: number) => void;
  /** Options for rows per page selector (server mode) */
  limitOptions?: number[];
  /** Loading state - shows skeleton when true */
  isLoading?: boolean;
  /** Number of rows per page for client-side pagination (default: 10) */
  pageSize?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className for the table container */
  className?: string;
  /** Show page size selector for client-side pagination */
  showPageSizeSelector?: boolean;
  /** Available page sizes for client-side pagination */
  pageSizeOptions?: number[];
}

/**
 * DataTable Component
 *
 * A flexible data table built on TanStack Table with support for
 * both client-side and server-side pagination.
 *
 * @example
 * // Server-side pagination (API-driven)
 * <DataTable
 *   columns={columns}
 *   data={students}
 *   paginationMode="server"
 *   serverPagination={data.pagination}
 *   onPageChange={setCurrentPage}
 *   isLoading={isLoading}
 * />
 *
 * @example
 * // Client-side pagination (local data)
 * <DataTable
 *   columns={columns}
 *   data={allItems}
 *   paginationMode="client"
 *   pageSize={20}
 * />
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  paginationMode = "server",
  serverPagination,
  onPageChange,
  onLimitChange,
  limitOptions,
  isLoading = false,
  pageSize = 10,
  emptyMessage = "No data found.",
  className,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 20, 30, 50],
}: DataTableProps<TData, TValue>) {
  // Client-side pagination state
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  // Configure table based on pagination mode
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Only use client-side pagination when mode is "client"
    ...(paginationMode === "client"
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          state: { pagination },
          onPaginationChange: setPagination,
        }
      : {
          // For server mode, we display all data (already paginated by server)
          manualPagination: true,
          pageCount: serverPagination?.totalPages ?? -1,
        }),
  });

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className={className}>
        <TableSkeleton
          columns={columns.length}
          rows={pageSize}
          headers={columns.map((col) => {
            // Extract header string if it's a simple string
            if (typeof col.header === "string") return col.header;
            return "";
          })}
        />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("py-12 text-center text-text-muted", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={header.column.columnDef.meta?.headerClassName}
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.columnDef.meta?.cellClassName}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {paginationMode === "server" && serverPagination && onPageChange ? (
        <div className="border-t border-border-subtle px-4">
          <Pagination
            pagination={serverPagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            limitOptions={limitOptions}
          />
        </div>
      ) : paginationMode === "client" ? (
        <ClientPagination
          table={table}
          showPageSizeSelector={showPageSizeSelector}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
    </div>
  );
}

/**
 * Client-side pagination controls
 */
function ClientPagination<TData>({
  table,
  showPageSizeSelector,
  pageSizeOptions,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
  showPageSizeSelector: boolean;
  pageSizeOptions: number[];
}) {
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;

  // Calculate showing X-Y of Z
  const start = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRows);

  if (pageCount <= 1 && !showPageSizeSelector) {
    return totalRows > 0 ? (
      <div className="flex items-center justify-center py-3 border-t border-border-subtle">
        <p className="text-sm text-text-muted">
          {totalRows} {totalRows === 1 ? "item" : "items"}
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 px-4 border-t border-border-subtle">
      {/* Info text */}
      <div className="flex items-center gap-4">
        <p
          className="text-sm text-text-muted text-center sm:text-left"
          role="status"
          aria-live="polite"
        >
          Showing {start}-{end} of {totalRows}
        </p>

        {/* Page size selector */}
        {showPageSizeSelector && (
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-border-subtle bg-bg-surface px-2 text-sm"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Pagination controls */}
      <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </Button>

        {/* Page indicator */}
        <span className="flex items-center px-3 text-sm text-text-muted">
          {currentPage} / {pageCount}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

// Extend TanStack Table's column meta type
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends unknown, TValue> {
    /** Additional className for the header cell */
    headerClassName?: string;
    /** Additional className for the body cells */
    cellClassName?: string;
  }
}
