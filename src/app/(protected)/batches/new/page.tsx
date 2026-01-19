"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BatchForm, type BatchFormData } from "@/components/batches";
import { useCreateBatch } from "@/lib/api/batches";
import { usePermissions } from "@/lib/hooks";
import { AccessDeniedPage } from "@/components/ui";

/**
 * Create Batch Page
 * 
 * Allows admins to create a new batch with:
 * - Auto-generated name (editable)
 * - Academic level and stream selection
 * - Class teacher assignment
 * - Session selection
 */
export default function CreateBatchPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const { mutate: createBatch, isPending } = useCreateBatch();

  const canCreate = can("STUDENT_EDIT");

  if (!canCreate) {
    return <AccessDeniedPage />;
  }

  const handleSubmit = (data: BatchFormData) => {
    // Clean up the data for API
    const payload = {
      name: data.name,
      academicLevel: data.academicLevel,
      stream: data.stream,
      classTeacherId: data.classTeacherId || undefined,
      sessionId: data.sessionId || undefined,
      isActive: data.isActive,
    };

    createBatch(payload, {
      onSuccess: (batch) => {
        toast.success("Batch created successfully");
        router.push(`/batches/${batch.id}`);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create batch"
        );
      },
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/batches">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Create New Batch
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Set up a new batch or class section
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchForm
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            submitLabel="Create Batch"
            showAutoName
          />
        </CardContent>
      </Card>
    </div>
  );
}
