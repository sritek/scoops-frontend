/**
 * Core type definitions for Scoops Frontend
 * These types should mirror the backend API contracts
 */

// User & Auth Types
export interface User {
  id: string;
  employeeId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  photoUrl?: string | null;
  role: UserRole;
  permissions: Permission[];
  branchId: string;
  branchName?: string;
  organizationId?: string;
  organizationName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backend uses lowercase role names
export type UserRole =
  | "admin"
  | "teacher"
  | "accounts"
  | "staff"
  // Legacy uppercase (for compatibility)
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "BRANCH_ADMIN"
  | "TEACHER"
  | "STAFF";

// Permission Types - Phase 1 features only
// Matches backend PERMISSIONS config
export type Permission =
  // Dashboard
  | "DASHBOARD_VIEW"
  // Students
  | "STUDENT_VIEW"
  | "STUDENT_EDIT"
  // Attendance
  | "ATTENDANCE_MARK"
  // Fees
  | "FEE_VIEW"
  | "FEE_UPDATE"
  // Users
  | "USER_MANAGE"
  // Settings
  | "SETTINGS_MANAGE";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Pagination query parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Default pagination values (matching backend)
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
} as const;

// Entity Types - Stubs for Phase 1
export interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string;
  parentPhone?: string;
  batchId: string;
  branchId: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  branchId: string;
  teacherId?: string;
  studentCount: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  markedBy: string;
  createdAt: string;
}

export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER";
  collectedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  employeeId: string;
  password: string;
}
