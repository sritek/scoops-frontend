/**
 * Branch API Types
 * Matches backend GET /branches response
 */

/**
 * Branch entity from API
 */
export interface Branch {
  id: string;
  orgId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isDefault: boolean;
  userCount: number;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create branch input
 */
export interface CreateBranchInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
}

/**
 * Update branch input
 */
export interface UpdateBranchInput {
  name?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  isDefault?: boolean;
}
