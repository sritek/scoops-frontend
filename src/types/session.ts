/**
 * Academic Session Types
 */

export interface AcademicSession {
  id: string;
  orgId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionInput {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export interface UpdateSessionInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}
