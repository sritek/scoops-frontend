/**
 * Batch API Types
 * Matches backend GET /batches response
 */

import type { AcademicSession } from "./session";

export type AcademicLevel = "primary" | "secondary" | "senior_secondary" | "coaching";
export type BatchStream = "science" | "commerce" | "arts";

export interface BatchTeacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface BatchSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface Batch {
  id: string;
  orgId: string;
  branchId: string;
  sessionId: string | null;
  name: string;
  academicLevel: AcademicLevel;
  stream: BatchStream | null;
  classTeacher: BatchTeacher | null;
  classTeacherId: string | null;
  // Keep backward compatibility
  teacher: BatchTeacher | null;
  session: BatchSession | null;
  studentCount: number;
  periodCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create batch input (for forms)
 */
export interface CreateBatchInput {
  name: string;
  academicLevel: AcademicLevel;
  stream?: BatchStream;
  classTeacherId?: string;
  sessionId?: string;
  isActive?: boolean;
}

/**
 * Update batch input (for forms)
 */
export interface UpdateBatchInput {
  name?: string;
  academicLevel?: AcademicLevel;
  stream?: BatchStream | null;
  classTeacherId?: string | null;
  sessionId?: string | null;
  isActive?: boolean;
}

/**
 * Academic level display labels
 */
export const academicLevelLabels: Record<AcademicLevel, string> = {
  primary: "Primary (1-5)",
  secondary: "Secondary (6-10)",
  senior_secondary: "Senior Secondary (11-12)",
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
 * Academic levels for select options
 */
export const academicLevels: AcademicLevel[] = [
  "primary",
  "secondary",
  "senior_secondary",
  "coaching",
];

/**
 * Batch streams for select options
 */
export const batchStreams: BatchStream[] = ["science", "commerce", "arts"];
