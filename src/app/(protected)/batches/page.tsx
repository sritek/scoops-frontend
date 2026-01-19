"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Layers, Plus, AlertCircle, Users, Eye, Calendar } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useBatches } from "@/lib/api/batches";
import { usePermissions } from "@/lib/hooks";
import {
  academicLevelLabels,
  streamLabels,
} from "@/lib/validations/batch";
import {
  Button,
  Card,
  CardContent,
  Badge,
  DataTable,
  EmptyState,
} from "@/components/ui";
import type { Batch } from "@/types/batch";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Batches List Page
 *
 * Displays batches in a paginated table using DataTable component.
 * Permission-gated "Create Batch" button.
 *
 * Requires: BATCH_VIEW permission
 */
export default function BatchesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { can } = usePermissions();

  // Fetch batches with pagination
  const { data, isLoading, error } = useBatches({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const batches = data?.data ?? [];
  const pagination = data?.pagination;

  const canCreateBatch = can("STUDENT_EDIT"); // Batch management uses STUDENT_EDIT permission

  // Column definitions for the DataTable
  const columns: ColumnDef<Batch>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const batch = row.original;
          return (
            <div>
              <p className="font-medium">{batch.name}</p>
              {batch.stream && (
                <p className="text-xs text-text-muted capitalize">
                  {streamLabels[batch.stream]}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "academicLevel",
        header: "Level",
        cell: ({ row }) => (
          <span className="capitalize">
            {academicLevelLabels[row.original.academicLevel]}
          </span>
        ),
        meta: {
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
      },
      {
        accessorKey: "teacher",
        header: "Teacher",
        cell: ({ row }) => {
          const teacher = row.original.teacher;
          if (!teacher) {
            return <span className="text-text-muted">—</span>;
          }
          return <span>{teacher.fullName}</span>;
        },
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "studentCount",
        header: "Students",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>{row.original.studentCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <Badge variant={isActive ? "success" : "default"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const batch = row.original;
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <Link href={`/batches/${batch.id}`} title="View batch">
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              {canCreateBatch && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link href={`/batches/${batch.id}/schedule`} title="Manage schedule">
                    <Calendar className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canCreateBatch]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Batches</h1>
          <p className="text-sm text-text-muted">
            Manage batches and class sections
          </p>
        </div>

        {canCreateBatch && (
          <Button asChild>
            <Link href="/batches/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Batch
            </Link>
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load batches. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Batches Table */}
      {!error && (
        <>
          {!isLoading && batches.length === 0 ? (
            <Card>
              <EmptyState
                icon={Layers}
                title="No batches yet"
                description="Create your first batch to start managing classes"
                action={
                  canCreateBatch ? (
                    <Button asChild>
                      <Link href="/batches/new">
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Create Batch
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <Card>
              <DataTable
                columns={columns}
                data={batches}
                paginationMode="server"
                serverPagination={pagination}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                pageSize={PAGINATION_DEFAULTS.LIMIT}
                emptyMessage="No batches found."
              />
            </Card>
          )}
        </>
      )}

    </div>
  );
}
