import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "../use-permissions";
import {
  createMockAdminUser,
  createMockTeacherUser,
  createMockUserWithPermissions,
} from "@/test/mocks/auth";

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock("@/lib/auth/context", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("can()", () => {
    it("returns true when user has the permission", () => {
      const adminUser = createMockAdminUser();
      mockUseAuth.mockReturnValue({ user: adminUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can("STUDENT_EDIT")).toBe(true);
      expect(result.current.can("DASHBOARD_VIEW")).toBe(true);
    });

    it("returns false when user does not have the permission", () => {
      const teacherUser = createMockTeacherUser();
      mockUseAuth.mockReturnValue({ user: teacherUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can("STUDENT_EDIT")).toBe(false);
      expect(result.current.can("USER_MANAGE")).toBe(false);
    });

    it("returns false when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can("STUDENT_VIEW")).toBe(false);
    });
  });

  describe("canAny()", () => {
    it("returns true when user has at least one permission", () => {
      const teacherUser = createMockTeacherUser();
      mockUseAuth.mockReturnValue({ user: teacherUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(["STUDENT_VIEW", "STUDENT_EDIT"])).toBe(true);
    });

    it("returns false when user has none of the permissions", () => {
      const teacherUser = createMockTeacherUser();
      mockUseAuth.mockReturnValue({ user: teacherUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAny(["STUDENT_EDIT", "USER_MANAGE"])).toBe(false);
    });
  });

  describe("canAll()", () => {
    it("returns true when user has all permissions", () => {
      const adminUser = createMockAdminUser();
      mockUseAuth.mockReturnValue({ user: adminUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAll(["STUDENT_VIEW", "STUDENT_EDIT"])).toBe(true);
    });

    it("returns false when user is missing some permissions", () => {
      const teacherUser = createMockTeacherUser();
      mockUseAuth.mockReturnValue({ user: teacherUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAll(["STUDENT_VIEW", "STUDENT_EDIT"])).toBe(false);
    });
  });

  describe("role-based permission checks", () => {
    it("admin has all permissions", () => {
      const adminUser = createMockAdminUser();
      mockUseAuth.mockReturnValue({ user: adminUser });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.can("STUDENT_EDIT")).toBe(true);
      expect(result.current.can("FEE_UPDATE")).toBe(true);
      expect(result.current.can("USER_MANAGE")).toBe(true);
      expect(result.current.can("SETTINGS_MANAGE")).toBe(true);
    });

    it("teacher can only mark attendance and view students", () => {
      const teacherUser = createMockTeacherUser();
      mockUseAuth.mockReturnValue({ user: teacherUser });

      const { result } = renderHook(() => usePermissions());

      // Teacher CAN
      expect(result.current.can("ATTENDANCE_MARK")).toBe(true);
      expect(result.current.can("STUDENT_VIEW")).toBe(true);
      expect(result.current.can("DASHBOARD_VIEW")).toBe(true);

      // Teacher CANNOT
      expect(result.current.can("STUDENT_EDIT")).toBe(false);
      expect(result.current.can("FEE_UPDATE")).toBe(false);
      expect(result.current.can("USER_MANAGE")).toBe(false);
    });

    it("accounts can view and update fees", () => {
      const accountsUser = createMockUserWithPermissions([
        "DASHBOARD_VIEW",
        "STUDENT_VIEW",
        "FEE_VIEW",
        "FEE_UPDATE",
      ]);
      mockUseAuth.mockReturnValue({ user: accountsUser });

      const { result } = renderHook(() => usePermissions());

      // Accounts CAN
      expect(result.current.can("FEE_VIEW")).toBe(true);
      expect(result.current.can("FEE_UPDATE")).toBe(true);

      // Accounts CANNOT
      expect(result.current.can("STUDENT_EDIT")).toBe(false);
      expect(result.current.can("ATTENDANCE_MARK")).toBe(false);
    });
  });
});
