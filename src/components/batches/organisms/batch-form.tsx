"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { FormField } from "@/components/forms";
import { TeacherSelect } from "../molecules/teacher-select";
import { SessionSelect } from "../molecules/session-select";
import { cn } from "@/lib/utils/cn";
import {
  academicLevels,
  batchStreams,
  academicLevelLabels,
  streamLabels,
  type AcademicLevel,
  type BatchStream,
} from "@/types/batch";

// Zod schema for batch form
const batchFormSchema = z.object({
  name: z
    .string()
    .min(1, "Batch name is required")
    .max(255, "Batch name is too long"),
  academicLevel: z.enum([
    "primary",
    "secondary",
    "senior_secondary",
    "coaching",
  ]),
  stream: z.enum(["science", "commerce", "arts"]).optional(),
  classTeacherId: z
    .string()
    .uuid("Invalid teacher ID")
    .optional()
    .or(z.literal("")),
  sessionId: z.string().uuid("Invalid session ID").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type BatchFormData = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  defaultValues?: Partial<BatchFormData>;
  onSubmit: (data: BatchFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  className?: string;
  /** "create" = session selectable; "edit" = session read-only */
  mode?: "create" | "edit";
  /** In edit mode, display this as the current session name (e.g. batch.session?.name) */
  currentSessionName?: string | null;
}

/**
 * BatchForm - Complete batch creation/edit form
 *
 * Features:
 * - Auto-generated batch name (optional)
 * - Academic level and stream selection
 * - Class teacher assignment
 * - Session selection
 * - Active status toggle
 */
export function BatchForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  className,
  mode = "create",
  currentSessionName,
}: BatchFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      academicLevel: "secondary",
      stream: undefined,
      classTeacherId: "",
      sessionId: "",
      isActive: true,
      ...defaultValues,
    },
  });

  const watchAcademicLevel = watch("academicLevel");
  const watchStream = watch("stream");
  const watchName = watch("name");

  // Show stream select only for senior_secondary
  const showStreamSelect = watchAcademicLevel === "senior_secondary";

  // Clear stream when academic level changes (if not senior secondary)
  useEffect(() => {
    if (!showStreamSelect && watchStream) {
      setValue("stream", undefined);
    }
  }, [showStreamSelect, watchStream, setValue]);

  const handleFormSubmit = (data: BatchFormData) => {
    // Clean up empty strings
    const cleanData: BatchFormData = {
      ...data,
      classTeacherId: data.classTeacherId || undefined,
      sessionId: data.sessionId || undefined,
      stream: showStreamSelect ? data.stream : undefined,
    };
    onSubmit(cleanData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* Batch Name - with auto-generation */}
      <FormField
        id="name"
        label="Batch Name"
        required
        error={errors.name?.message}
      >
        <Input id="name" placeholder="e.g., Class 10-A" {...register("name")} />
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

      {/* Stream (conditional) */}
      {showStreamSelect && (
        <FormField id="stream" label="Stream" error={errors.stream?.message}>
          <Controller
            name="stream"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || undefined)}
              >
                <SelectTrigger id="stream">
                  <SelectValue placeholder="Select stream" />
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
      )}

      {/* Session Select (create) or read-only (edit) */}
      <FormField
        id="sessionId"
        label="Academic Session"
        error={errors.sessionId?.message}
        helperText={
          mode === "edit"
            ? "Academic session cannot be changed for existing batches."
            : "Assign batch to an academic session"
        }
      >
        {mode === "edit" ? (
          <p className="text-sm text-text-muted py-2 px-3 rounded-md border border-border-subtle bg-bg-app">
            {currentSessionName ?? "—"}
          </p>
        ) : (
          <Controller
            name="sessionId"
            control={control}
            render={({ field }) => (
              <SessionSelect
                value={field.value || undefined}
                onChange={(val) => field.onChange(val || "")}
                placeholder="Select session (optional)"
              />
            )}
          />
        )}
      </FormField>

      {/* Class Teacher */}
      <FormField
        id="classTeacherId"
        label="Class Teacher"
        error={errors.classTeacherId?.message}
        helperText="Assign a primary class teacher"
      >
        <Controller
          name="classTeacherId"
          control={control}
          render={({ field }) => (
            <TeacherSelect
              value={field.value || undefined}
              onChange={(val) => field.onChange(val || "")}
              placeholder="Select teacher (optional)"
            />
          )}
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
        <Label htmlFor="isActive" className="cursor-pointer">
          Batch is active
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
