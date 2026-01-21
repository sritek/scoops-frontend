"use client";

import { useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParentAuth } from "@/lib/auth";
import { parentNavItems } from "@/config/parent-navigation";
import { ParentSidebar } from "./parent-sidebar";
import { ParentMobileHeader } from "./parent-mobile-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  ThemeToggle,
} from "@/components/ui";

interface ParentAppShellProps {
  children: ReactNode;
}

/**
 * Parent App Shell Component
 *
 * Main layout wrapper for parent portal that combines:
 * - Sidebar (desktop: fixed, mobile: drawer)
 * - Mobile header with hamburger menu
 * - Desktop header with user menu
 * - Bottom navigation (mobile only)
 * - Main content area
 *
 * Responsive behavior:
 * - Desktop (≥768px): Fixed sidebar + top header
 * - Mobile (<768px): Mobile header + bottom nav
 */
export function ParentAppShell({ children }: ParentAppShellProps) {
  const { parent, signOut } = useParentAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const parentName = parent
    ? `${parent.firstName} ${parent.lastName}`
    : "Parent";
  const parentInitial = parent?.firstName?.charAt(0) || "P";

  return (
    <div className="min-h-screen bg-bg-app">
      {/* Sidebar - desktop always visible, mobile drawer */}
      <ParentSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile header - mobile only */}
      <ParentMobileHeader onMenuClick={openSidebar} />

      {/* Main content area */}
      <div
        className={cn(
          // Desktop: offset by sidebar width
          "md:pl-60",
          // Mobile: offset by header height, and bottom nav
          "pt-14 md:pt-0",
          "pb-16 md:pb-0"
        )}
      >
        {/* Desktop header - desktop only */}
        <header
          className={cn(
            "hidden md:flex",
            "h-14 items-center justify-end",
            "border-b border-border-subtle",
            "bg-bg-surface px-6"
          )}
        >
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-1.5",
                  "hover:bg-bg-app",
                  "focus-visible:outline-2 focus-visible:outline-ring"
                )}
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {parentName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {parent?.phone || "—"}
                  </p>
                </div>
                <Avatar fallback={parentInitial} alt={parentName} size="md" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{parentName}</span>
                  <span className="text-xs font-normal text-text-muted">
                    Parent Portal
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/parent/profile">
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeToggle />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-error focus:text-error"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {/* Bottom navigation - mobile only */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 md:hidden",
          "h-16 bg-bg-surface",
          "border-t border-border-subtle",
          "flex items-center justify-around",
          "safe-bottom"
        )}
      >
        {parentNavItems.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/parent" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                "w-16 h-full",
                "transition-colors",
                isActive
                  ? "text-primary-600"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
