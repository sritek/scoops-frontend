"use client";

import { useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks";
import { Sidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
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

interface AppShellProps {
  children: ReactNode;
}

/**
 * App Shell Component
 *
 * Main layout wrapper that combines:
 * - Sidebar (desktop: fixed, mobile: drawer)
 * - Mobile header with hamburger menu
 * - Desktop header with user menu
 * - Main content area
 *
 * Responsive behavior:
 * - Desktop (≥768px): Fixed sidebar + content
 * - Mobile (<768px): Collapsible sidebar + fixed header
 */
export function AppShell({ children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { can } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const canManageSettings = can("SETTINGS_MANAGE");

  return (
    <div className="min-h-screen bg-bg-app">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Mobile header */}
      <MobileHeader onMenuClick={openSidebar} />

      {/* Main content area */}
      <div
        className={cn(
          // Desktop: offset by sidebar width
          "md:pl-60",
          // Mobile: offset by header height
          "pt-14 md:pt-0"
        )}
      >
        {/* Desktop header */}
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
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {user?.branchName || user?.role || "—"}
                  </p>
                </div>
                <Avatar
                  src={user?.photoUrl}
                  fallback={user?.name?.charAt(0)}
                  alt={user?.name || "User"}
                  size="md"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name || "User"}</span>
                  <span className="text-xs font-normal text-text-muted">
                    {user?.organizationName || "—"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              {canManageSettings && (
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
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
    </div>
  );
}
