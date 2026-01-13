"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Plus, AlertCircle, Users } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useBatches, useCreateBatch } from "@/lib/api/batches";
import { usePermissions } from "@/lib/hooks";
import {
  batchFormSchema,
  defaultBatchFormValues,
  academicLevels,
  batchStreams,
  academicLevelLabels,
  streamLabels,
  type BatchFormData,
} from "@/lib/validations/batch";
import { FormField } from "@/components/forms";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  Badge,
  DataTable,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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
    ],
    []
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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Batch
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
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Create Batch
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

      {/* Create Batch Dialog */}
      <CreateBatchDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

/**
 * Create Batch Dialog Component
 */
function CreateBatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate: createBatch, isPending, error: submitError } = useCreateBatch();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultBatchFormValues,
  });

  const onSubmit = (data: BatchFormData) => {
    // Filter out empty teacherId
    const payload = {
      ...data,
      teacherId: data.teacherId || undefined,
    };

    createBatch(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Batch</DialogTitle>
          <DialogDescription>
            Add a new batch or class section to your branch
          </DialogDescription>
        </DialogHeader>

        {/* Submit Error */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 text-error" />
            <p className="text-sm text-error">
              {submitError instanceof Error
                ? submitError.message
                : "Failed to create batch. Please try again."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Batch Name */}
          <FormField
            id="name"
            label="Batch Name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              placeholder="e.g., Class 10-A"
              {...register("name")}
            />
          </FormField>

          {/* Academic Level */}
          <FormField
            id="academicLevel"
            label="Academic Level"
            required
            error={errors.academicLevel?.message}
          >
            <Controller
              name="academicLevel"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="academicLevel">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {academicLevelLabels[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Stream (optional) */}
          <FormField
            id="stream"
            label="Stream"
            error={errors.stream?.message}
            helperText="Optional - for senior secondary batches"
          >
            <Controller
              name="stream"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || undefined)}
                >
                  <SelectTrigger id="stream">
                    <SelectValue placeholder="Select stream (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchStreams.map((stream) => (
                      <SelectItem key={stream} value={stream}>
                        {streamLabels[stream]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          {/* Teacher ID (text input) */}
          <FormField
            id="teacherId"
            label="Teacher ID"
            error={errors.teacherId?.message}
            helperText="Enter teacher's UUID (optional)"
          >
            <Input
              id="teacherId"
              placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
              {...register("teacherId")}
            />
          </FormField>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label
              htmlFor="isActive"
              className="cursor-pointer"
            >
              Batch is active
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
