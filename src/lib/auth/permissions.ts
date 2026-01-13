import type { Permission, User } from "@/types";

/**
 * Permission Utilities
 *
 * Pure UI helpers for hiding/disabling UI elements based on permissions.
 * These are NOT security checks - backend enforces actual permissions.
 *
 * Design principles:
 * - No role checks (backend grants permissions based on role)
 * - No business logic
 * - Pure permission array lookups only
 */

/**
 * Check if user has a specific permission
 *
 * @param user - Current user object
 * @param permission - Permission to check
 * @returns true if user has the permission
 *
 * @example
 * if (can(user, "STUDENT_CREATE")) {
 *   // Show create button
 * }
 */
export function can(user: User | null, permission: Permission): boolean {
  if (!user) {
    return false;
  }

  return user.permissions.includes(permission);
}

/**
 * Check if user has any of the given permissions
 *
 * @param user - Current user object
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one of the permissions
 *
 * @example
 * if (canAny(user, ["STUDENT_CREATE", "STUDENT_UPDATE"])) {
 *   // Show edit section
 * }
 */
export function canAny(user: User | null, permissions: Permission[]): boolean {
  if (!user) {
    return false;
  }

  return permissions.some((permission) =>
    user.permissions.includes(permission)
  );
}

/**
 * Check if user has all of the given permissions
 *
 * @param user - Current user object
 * @param permissions - Array of permissions to check
 * @returns true if user has all of the permissions
 *
 * @example
 * if (canAll(user, ["FEE_VIEW", "FEE_COLLECT"])) {
 *   // Show fee collection UI
 * }
 */
export function canAll(user: User | null, permissions: Permission[]): boolean {
  if (!user) {
    return false;
  }

  return permissions.every((permission) =>
    user.permissions.includes(permission)
  );
}

/**
 * Permission groups for common UI patterns
 *
 * Use with canAny/canAll for grouped permission checks
 *
 * @example
 * if (canAny(user, PermissionGroups.manageStudents)) {
 *   // Show student management section
 * }
 */
export const PermissionGroups = {
  // Student management
  manageStudents: ["STUDENT_EDIT"] as Permission[],

  // Attendance management
  manageAttendance: ["ATTENDANCE_MARK"] as Permission[],

  // Fee management
  manageFees: ["FEE_UPDATE"] as Permission[],

  // User management
  manageUsers: ["USER_MANAGE"] as Permission[],

  // Settings management
  manageSettings: ["SETTINGS_MANAGE"] as Permission[],
} as const;
