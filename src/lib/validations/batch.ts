import { z } from "zod";

/**
 * Academic level enum values
 */
export const academicLevels = [
  "primary",
  "secondary",
  "senior_secondary",
  "coaching",
] as const;
export type AcademicLevel = (typeof academicLevels)[number];

/**
 * Stream enum values
 */
export const batchStreams = ["science", "commerce", "arts"] as const;
export type BatchStream = (typeof batchStreams)[number];

/**
 * Academic level display labels
 */
export const academicLevelLabels: Record<AcademicLevel, string> = {
  primary: "Primary",
  secondary: "Secondary",
  senior_secondary: "Senior Secondary",
  coaching: "Coaching",
};

/**
 * Stream display labels
 */
export const streamLabels: Record<BatchStream, string> = {
  science: "Science",
  commerce: "Commerce",
  arts: "Arts",
};

/**
 * Batch form schema
 * Matches backend createBatchSchema
 */
export const batchFormSchema = z.object({
  name: z
    .string()
    .min(1, "Batch name is required")
    .max(255, "Batch name is too long"),
  academicLevel: z.enum(academicLevels),
  stream: z.enum(batchStreams).optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/**
 * Type for batch form data
 */
export type BatchFormData = z.infer<typeof batchFormSchema>;

/**
 * Default values for the form
 */
export const defaultBatchFormValues: BatchFormData = {
  name: "",
  academicLevel: "secondary",
  stream: undefined,
  teacherId: "",
  isActive: true,
};
