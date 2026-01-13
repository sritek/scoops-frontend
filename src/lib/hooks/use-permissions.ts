"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { can, canAny, canAll, PermissionGroups } from "@/lib/auth/permissions";
import type { Permission } from "@/types";

/**
 * usePermissions Hook
 *
 * Pure UI helper for checking user permissions.
 * Use this to hide/disable UI elements based on permissions.
 *
 * This is NOT a security check - backend enforces actual permissions.
 * Frontend may still receive 403 errors if permissions change.
 *
 * @example
 * const { can, canAny } = usePermissions();
 *
 * // Single permission check
 * if (can("STUDENT_CREATE")) {
 *   return <Button>Add Student</Button>;
 * }
 *
 * // Multiple permissions (any)
 * if (canAny(["STUDENT_UPDATE", "STUDENT_DELETE"])) {
 *   return <ActionMenu />;
 * }
 */
export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const checkCan = useCallback(
    (permission: Permission): boolean => {
      return can(user, permission);
    },
    [user]
  );

  /**
   * Check if user has any of the given permissions
   */
  const checkCanAny = useCallback(
    (permissions: Permission[]): boolean => {
      return canAny(user, permissions);
    },
    [user]
  );

  /**
   * Check if user has all of the given permissions
   */
  const checkCanAll = useCallback(
    (permissions: Permission[]): boolean => {
      return canAll(user, permissions);
    },
    [user]
  );

  return {
    /** Check single permission */
    can: checkCan,
    /** Check if user has any of the permissions */
    canAny: checkCanAny,
    /** Check if user has all of the permissions */
    canAll: checkCanAll,
    /** Pre-defined permission groups */
    groups: PermissionGroups,
  };
}
