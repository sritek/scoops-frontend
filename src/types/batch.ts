/**
 * Batch API Types
 * Matches backend GET /batches response
 */

export type AcademicLevel = "primary" | "secondary" | "senior_secondary" | "coaching";
export type BatchStream = "science" | "commerce" | "arts";

export interface BatchTeacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface Batch {
  id: string;
  orgId: string;
  branchId: string;
  name: string;
  academicLevel: AcademicLevel;
  stream: BatchStream | null;
  teacher: BatchTeacher | null;
  teacherId: string | null;
  studentCount: number;
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
  teacherId?: string;
  isActive?: boolean;
}

/**
 * Update batch input (for forms)
 */
export interface UpdateBatchInput {
  name?: string;
  academicLevel?: AcademicLevel;
  stream?: BatchStream | null;
  teacherId?: string | null;
  isActive?: boolean;
}
