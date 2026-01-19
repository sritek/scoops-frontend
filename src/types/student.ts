/**
 * Student API Types
 * Matches backend GET /students response
 */

export type StudentStatus = "active" | "inactive";
export type StudentGender = "male" | "female" | "other";
export type StudentCategory = "gen" | "sc" | "st" | "obc" | "minority";
export type ParentRelation = "father" | "mother" | "guardian" | "other";

export interface StudentParent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  relation: ParentRelation;
  isPrimaryContact: boolean;
}

export interface Student {
  id: string;
  orgId: string;
  branchId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: StudentGender | null;
  dob: string | null;
  category: StudentCategory | null;
  isCwsn: boolean | null;
  photoUrl: string | null;
  admissionYear: number;
  status: StudentStatus;
  batchId: string | null;
  /** Batch name (populated from batch relation) */
  batchName: string | null;
  createdAt: string;
  updatedAt: string;
  parents: StudentParent[];
}

/**
 * Create student input (for forms)
 */
export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender?: StudentGender;
  dob?: string;
  category?: StudentCategory;
  isCwsn?: boolean;
  photoUrl?: string | null;
  admissionYear: number;
  batchId?: string;
  parents?: {
    firstName: string;
    lastName: string;
    phone: string;
    relation: ParentRelation;
    photoUrl?: string | null;
    isPrimaryContact?: boolean;
  }[];
}

/**
 * Update student input (for forms)
 */
export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  gender?: StudentGender;
  dob?: string;
  category?: StudentCategory;
  isCwsn?: boolean;
  photoUrl?: string | null;
  admissionYear?: number;
  batchId?: string | null;
  status?: StudentStatus;
  parents?: {
    firstName: string;
    lastName: string;
    phone: string;
    relation: ParentRelation;
    photoUrl?: string | null;
    isPrimaryContact?: boolean;
  }[];
}
