import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./table";

export interface TableSkeletonProps {
  /** Number of columns to render */
  columns: number;
  /** Number of rows to render (default: 10) */
  rows?: number;
  /** Column headers (optional) */
  headers?: string[];
  /** Additional className for the container */
  className?: string;
}

/**
 * Skeleton placeholder for table loading states
 *
 * Uses Tailwind's built-in animate-pulse for loading effect.
 * Follows Sritek Design System tokens.
 *
 * @example
 * <TableSkeleton columns={4} />
 * <TableSkeleton columns={4} rows={5} headers={["Name", "Email", "Role", "Status"]} />
 */
export function TableSkeleton({
  columns,
  rows = 10,
  headers,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      <Table>
        {headers && headers.length > 0 && (
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    className={cn(
                      "h-4",
                      // Vary widths for more natural look
                      colIndex === 0
                        ? "w-3/4"
                        : colIndex === columns - 1
                          ? "w-16"
                          : "w-1/2"
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Basic skeleton component for loading placeholders
 *
 * Uses Tailwind's built-in animate-pulse and design system colors.
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 * <Skeleton className="h-12 w-full rounded-lg" />
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-border-subtle",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
