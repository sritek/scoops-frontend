import type { User, Permission, UserRole } from "@/types";

/**
 * Mock user factory for testing
 * Creates users with different roles and permissions
 * 
 * Permissions match backend PERMISSIONS config:
 * - DASHBOARD_VIEW
 * - STUDENT_VIEW
 * - STUDENT_EDIT
 * - ATTENDANCE_MARK
 * - FEE_VIEW
 * - FEE_UPDATE
 * - USER_MANAGE
 * - SETTINGS_MANAGE
 */

// Admin permissions (all Phase-1 permissions)
const ADMIN_PERMISSIONS: Permission[] = [
  "DASHBOARD_VIEW",
  "STUDENT_VIEW",
  "STUDENT_EDIT",
  "ATTENDANCE_MARK",
  "FEE_VIEW",
  "FEE_UPDATE",
  "USER_MANAGE",
  "SETTINGS_MANAGE",
];

// Teacher permissions
const TEACHER_PERMISSIONS: Permission[] = [
  "DASHBOARD_VIEW",
  "STUDENT_VIEW",
  "ATTENDANCE_MARK",
];

// Accounts permissions
const ACCOUNTS_PERMISSIONS: Permission[] = [
  "DASHBOARD_VIEW",
  "STUDENT_VIEW",
  "FEE_VIEW",
  "FEE_UPDATE",
];

// Staff permissions (minimal)
const STAFF_PERMISSIONS: Permission[] = [
  "DASHBOARD_VIEW",
  "STUDENT_VIEW",
];

/**
 * Create a mock admin user
 */
export function createMockAdminUser(overrides?: Partial<User>): User {
  return {
    id: "admin-user-id",
    name: "Test Admin",
    firstName: "Test",
    lastName: "Admin",
    phone: "9876543210",
    email: "admin@test.com",
    role: "admin" as UserRole,
    permissions: ADMIN_PERMISSIONS,
    branchId: "branch-1",
    branchName: "Main Branch",
    organizationId: "org-1",
    organizationName: "Test Organization",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock teacher user
 */
export function createMockTeacherUser(overrides?: Partial<User>): User {
  return {
    id: "teacher-user-id",
    name: "Test Teacher",
    firstName: "Test",
    lastName: "Teacher",
    phone: "9876543211",
    email: "teacher@test.com",
    role: "teacher" as UserRole,
    permissions: TEACHER_PERMISSIONS,
    branchId: "branch-1",
    branchName: "Main Branch",
    organizationId: "org-1",
    organizationName: "Test Organization",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock accounts user
 */
export function createMockAccountsUser(overrides?: Partial<User>): User {
  return {
    id: "accounts-user-id",
    name: "Test Accounts",
    firstName: "Test",
    lastName: "Accounts",
    phone: "9876543212",
    email: "accounts@test.com",
    role: "accounts" as UserRole,
    permissions: ACCOUNTS_PERMISSIONS,
    branchId: "branch-1",
    branchName: "Main Branch",
    organizationId: "org-1",
    organizationName: "Test Organization",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock staff user
 */
export function createMockStaffUser(overrides?: Partial<User>): User {
  return {
    id: "staff-user-id",
    name: "Test Staff",
    firstName: "Test",
    lastName: "Staff",
    phone: "9876543213",
    email: "staff@test.com",
    role: "staff" as UserRole,
    permissions: STAFF_PERMISSIONS,
    branchId: "branch-1",
    branchName: "Main Branch",
    organizationId: "org-1",
    organizationName: "Test Organization",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock user with specific permissions
 */
export function createMockUserWithPermissions(
  permissions: Permission[],
  overrides?: Partial<User>
): User {
  return {
    id: "custom-user-id",
    name: "Custom User",
    firstName: "Custom",
    lastName: "User",
    phone: "9876543214",
    role: "staff" as UserRole,
    permissions,
    branchId: "branch-1",
    branchName: "Main Branch",
    organizationId: "org-1",
    organizationName: "Test Organization",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock auth state for testing
 */
export interface MockAuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const mockAuthStates = {
  /** Authenticated as admin */
  authenticatedAdmin: {
    user: createMockAdminUser(),
    isLoading: false,
    isAuthenticated: true,
    error: null,
  } as MockAuthState,

  /** Authenticated as teacher */
  authenticatedTeacher: {
    user: createMockTeacherUser(),
    isLoading: false,
    isAuthenticated: true,
    error: null,
  } as MockAuthState,

  /** Authenticated as accounts */
  authenticatedAccounts: {
    user: createMockAccountsUser(),
    isLoading: false,
    isAuthenticated: true,
    error: null,
  } as MockAuthState,

  /** Authenticated as staff */
  authenticatedStaff: {
    user: createMockStaffUser(),
    isLoading: false,
    isAuthenticated: true,
    error: null,
  } as MockAuthState,

  /** Not authenticated */
  unauthenticated: {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  } as MockAuthState,

  /** Loading state */
  loading: {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  } as MockAuthState,

  /** Error state */
  error: {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: "Authentication failed",
  } as MockAuthState,
};
