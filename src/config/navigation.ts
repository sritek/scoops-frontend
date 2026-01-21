import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardCheck,
  IndianRupee,
  UserCog,
  Building2,
  Briefcase,
  FileText,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Calendar,
  BookOpen,
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
    permission: "ATTENDANCE_VIEW", // Accounts won't have this - attendance hidden for them
  },
  {
    href: "/leave-applications",
    label: "Leave Requests",
    icon: CalendarDays,
    permission: "ATTENDANCE_VIEW",
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    permission: "DASHBOARD_VIEW",
  },
  {
    href: "/fees",
    label: "Fees",
    icon: IndianRupee,
    permission: "FEE_VIEW",
  },
  {
    href: "/exams",
    label: "Exams",
    icon: GraduationCap,
    permission: "STUDENT_VIEW",
  },
  {
    href: "/homework",
    label: "Homework",
    icon: BookOpen,
    permission: "STUDENT_VIEW",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    permission: "DASHBOARD_VIEW",
  },
  {
    href: "/complaints",
    label: "Complaints",
    icon: AlertTriangle,
    permission: "DASHBOARD_VIEW",
  },
  {
    href: "/users",
    label: "Users",
    icon: UserCog,
    permission: "USER_MANAGE",
  },
  {
    href: "/staff",
    label: "Staff",
    icon: Briefcase,
    permission: "USER_MANAGE",
  },
  {
    href: "/branches",
    label: "Branches",
    icon: Building2,
    permission: "SETTINGS_MANAGE",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    permission: "SETTINGS_MANAGE",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
    permission: "DASHBOARD_VIEW",
  },
  // Settings and Jobs are accessible via the user dropdown menu in the header
];

/**
 * App metadata for branding
 */
export const appMeta = {
  name: "Scoops",
  tagline: "School Operations",
} as const;
