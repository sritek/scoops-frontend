import {
  Home,
  Users,
  Calendar,
  CreditCard,
  MessageCircle,
  Megaphone,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Parent navigation item configuration
 */
export interface ParentNavItem {
  /** Route path */
  href: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
}

/**
 * Parent Portal Navigation Items
 *
 * Single source of truth for parent sidebar/bottom navigation.
 * All items are visible to parents (no permission filtering).
 */
export const parentNavItems: ParentNavItem[] = [
  {
    href: "/parent",
    label: "Home",
    icon: Home,
  },
  {
    href: "/parent/children",
    label: "Children",
    icon: Users,
  },
  {
    href: "/parent/calendar",
    label: "Calendar",
    icon: Calendar,
  },
  {
    href: "/parent/fees",
    label: "Fees",
    icon: CreditCard,
  },
  {
    href: "/parent/messages",
    label: "Messages",
    icon: MessageCircle,
  },
  {
    href: "/parent/announcements",
    label: "Announcements",
    icon: Megaphone,
  },
  {
    href: "/parent/complaints",
    label: "Complaints",
    icon: AlertCircle,
  },
];

/**
 * App metadata for parent portal branding
 */
export const parentAppMeta = {
  name: "Scoops",
  tagline: "Parent Portal",
} as const;
