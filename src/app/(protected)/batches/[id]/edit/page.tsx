"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from "@/components/ui";
import { BatchForm, type BatchFormData } from "@/components/batches";
import { useBatch, useUpdateBatch } from "@/lib/api/batches";
import { usePermissions } from "@/lib/hooks";
import { AccessDeniedPage } from "@/components/ui";

/**
 * Edit Batch Page
 *
 * Allows admins to edit an existing batch.
 */
export default function EditBatchPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { can } = usePermissions();

  const { data: batchData, isLoading } = useBatch(batchId);
  const { mutate: updateBatch, isPending } = useUpdateBatch();

  const canEdit = can("STUDENT_EDIT");
  const batch = batchData?.data;

  if (!canEdit) {
    return <AccessDeniedPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Batch not found</p>
        <Button asChild className="mt-4">
          <Link href="/batches">Back to Batches</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = (data: BatchFormData) => {
    // Session cannot be changed via this form; omit sessionId so backend keeps existing value.
    const payload = {
      name: data.name,
      academicLevel: data.academicLevel,
      stream: data.stream,
      classTeacherId: data.classTeacherId || null,
      isActive: data.isActive,
    };

    updateBatch(
      { id: batchId, data: payload },
      {
        onSuccess: () => {
          toast.success("Batch updated successfully");
          router.push(`/batches/${batchId}`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to update batch",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-text-primary">Edit Batch</h1>
        <p className="text-sm text-text-muted mt-1">
          Update batch information for {batch.name}
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchForm
            mode="edit"
            currentSessionName={batch.session?.name ?? null}
            defaultValues={{
              name: batch.name,
              academicLevel: batch.academicLevel,
              stream: batch.stream || undefined,
              classTeacherId: batch.classTeacherId || "",
              sessionId: batch.sessionId || "",
              isActive: batch.isActive,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            submitLabel="Update Batch"
          />
        </CardContent>
      </Card>
    </div>
  );
}
