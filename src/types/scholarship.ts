/**
 * Scholarship API Types
 */

export type ScholarshipType = "percentage" | "fixed_amount" | "component_waiver";
export type ScholarshipBasis =
  | "merit"
  | "need_based"
  | "sports"
  | "sibling"
  | "staff_ward"
  | "government"
  | "custom";

/**
 * Scholarship definition
 */
export interface Scholarship {
  id: string;
  orgId: string;
  name: string;
  type: ScholarshipType;
  basis: ScholarshipBasis;
  value: number; // Percentage (0-100) or fixed amount
  componentId: string | null;
  maxAmount: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  feeComponent?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

/**
 * Student scholarship assignment
 */
export interface StudentScholarship {
  id: string;
  studentId: string;
  scholarshipId: string;
  sessionId: string;
  discountAmount: number;
  approvedAt: string;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  scholarship: {
    id: string;
    name: string;
    type: ScholarshipType;
    basis: ScholarshipBasis;
    value: number;
    maxAmount: number | null;
  };
  session: {
    id: string;
    name: string;
  };
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Create scholarship input
 */
export interface CreateScholarshipInput {
  name: string;
  type: ScholarshipType;
  basis: ScholarshipBasis;
  value: number;
  componentId?: string;
  maxAmount?: number;
  description?: string;
}

/**
 * Update scholarship input
 */
export interface UpdateScholarshipInput {
  name?: string;
  value?: number;
  maxAmount?: number | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Assign scholarship input
 */
export interface AssignScholarshipInput {
  studentId: string;
  scholarshipId: string;
  sessionId: string;
  remarks?: string;
}

/**
 * Get human-readable scholarship type label
 */
export function getScholarshipTypeLabel(type: ScholarshipType): string {
  switch (type) {
    case "percentage":
      return "Percentage Discount";
    case "fixed_amount":
      return "Fixed Amount";
    case "component_waiver":
      return "Component Waiver";
    default:
      return type;
  }
}

/**
 * Get human-readable scholarship basis label
 */
export function getScholarshipBasisLabel(basis: ScholarshipBasis): string {
  switch (basis) {
    case "merit":
      return "Merit Based";
    case "need_based":
      return "Need Based";
    case "sports":
      return "Sports";
    case "sibling":
      return "Sibling Discount";
    case "staff_ward":
      return "Staff Ward";
    case "government":
      return "Government";
    case "custom":
      return "Custom";
    default:
      return basis;
  }
}

/**
 * Format scholarship value for display
 */
export function formatScholarshipValue(scholarship: {
  type: ScholarshipType;
  value: number;
  maxAmount?: number | null;
}): string {
  switch (scholarship.type) {
    case "percentage":
      const maxStr = scholarship.maxAmount ? ` (max ₹${scholarship.maxAmount.toLocaleString()})` : "";
      return `${scholarship.value}%${maxStr}`;
    case "fixed_amount":
      return `₹${scholarship.value.toLocaleString()}`;
    case "component_waiver":
      return "100% Waiver";
    default:
      return String(scholarship.value);
  }
}
