import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { PaginationMeta } from "@/types";

export interface PaginationProps {
  /** Pagination metadata from API response */
  pagination: PaginationMeta;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Additional className */
  className?: string;
  /** Show "Showing X-Y of Z" text */
  showInfo?: boolean;
}

/**
 * Pagination Component
 *
 * Server-side pagination controls with:
 * - Previous/Next buttons
 * - Page number indicators
 * - "Showing X-Y of Z" text
 * - Mobile-friendly (simplified on small screens)
 *
 * @example
 * <Pagination
 *   pagination={data.pagination}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 */
export function Pagination({
  pagination,
  onPageChange,
  className,
  showInfo = true,
}: PaginationProps) {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  // Calculate range for "Showing X-Y of Z"
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to display
  const pageNumbers = getPageNumbers(page, totalPages);

  if (totalPages <= 1) {
    // Don't render pagination for single page
    return showInfo && total > 0 ? (
      <div className={cn("flex items-center justify-center py-3", className)}>
        <p className="text-sm text-text-muted">
          {total} {total === 1 ? "item" : "items"}
        </p>
      </div>
    ) : null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3",
        className
      )}
    >
      {/* Info text */}
      {showInfo && (
        <p
          className="text-sm text-text-muted text-center sm:text-left"
          role="status"
          aria-live="polite"
        >
          Showing {start}-{end} of {total}
        </p>
      )}

      {/* Pagination controls */}
      <nav
        className="flex items-center justify-center gap-1"
        aria-label="Pagination"
      >
        {/* Previous button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </Button>

        {/* Page numbers - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === "ellipsis" ? (
                <span
                  className="flex h-9 w-9 items-center justify-center text-text-muted"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant={pageNum === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === page ? "page" : undefined}
                  className="min-w-[36px]"
                >
                  {pageNum}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile page indicator */}
        <span className="flex sm:hidden items-center px-3 text-sm text-text-muted">
          {page} / {totalPages}
        </span>

        {/* Next button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Go to next page"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

/**
 * Generate array of page numbers to display
 * Shows: 1 ... 4 5 [6] 7 8 ... 20
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  // Show pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}

/**
 * Simple pagination info without controls
 * Use when you just want to show "Showing X-Y of Z"
 */
export function PaginationInfo({
  pagination,
  className,
}: {
  pagination: PaginationMeta;
  className?: string;
}) {
  const { page, limit, total } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <p
      className={cn("text-sm text-text-muted", className)}
      role="status"
      aria-live="polite"
    >
      Showing {start}-{end} of {total}
    </p>
  );
}
