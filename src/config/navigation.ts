import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardCheck,
  IndianRupee,
  UserCog,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/types";

/**
 * Navigation item configuration
 */
export interface NavItem {
  /** Route path */
  href: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Required permission to view this item */
  permission: Permission;
}

/**
 * Phase 1 Navigation Items
 *
 * Single source of truth for sidebar navigation.
 * Items are filtered based on user permissions.
 *
 * Rules:
 * - No nested menus (Phase 1)
 * - Permission-based visibility
 * - Icons are outline style (Lucide)
 */
export const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "DASHBOARD_VIEW",
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
    permission: "STUDENT_VIEW",
  },
  {
    href: "/batches",
    label: "Batches",
    icon: Layers,
    permission: "STUDENT_VIEW", // Batches visible to anyone who can view students
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    permission: "ATTENDANCE_MARK",
  },
  {
    href: "/fees",
    label: "Fees",
    icon: IndianRupee,
    permission: "FEE_VIEW",
  },
  {
    href: "/users",
    label: "Users",
    icon: UserCog,
    permission: "USER_MANAGE",
  },
  {
    href: "/branches",
    label: "Branches",
    icon: Building2,
    permission: "SETTINGS_MANAGE",
  },
];

/**
 * App metadata for branding
 */
export const appMeta = {
  name: "Scoops",
  tagline: "School Operations",
} as const;
