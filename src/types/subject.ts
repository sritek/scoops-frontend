/**
 * Subject Types
 */

export interface Subject {
  id: string;
  orgId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateSubjectInput {
  name?: string;
  code?: string;
  isActive?: boolean;
}
