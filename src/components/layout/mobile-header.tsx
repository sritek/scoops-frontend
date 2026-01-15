"use client";

import Link from "next/link";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks";
import { appMeta } from "@/config/navigation";
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

interface MobileHeaderProps {
  /** Callback to open sidebar */
  onMenuClick: () => void;
}

/**
 * Mobile Header Component
 *
 * Shown only on mobile (<768px)
 * Contains hamburger menu, app title, and user menu
 */
export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user, signOut } = useAuth();
  const { can } = usePermissions();
  const canManageSettings = can("SETTINGS_MANAGE");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 md:hidden",
        "h-14 bg-bg-surface",
        "border-b border-border-subtle",
        "flex items-center justify-between px-4"
      )}
    >
      {/* Menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn(
          "rounded p-2",
          "text-text-muted hover:text-text-primary",
          "hover:bg-bg-app",
          "focus-visible:outline-2 focus-visible:outline-ring"
        )}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* App title */}
      <h1 className="font-semibold text-text-primary">
        {appMeta.name}
      </h1>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "focus-visible:outline-2 focus-visible:outline-ring"
            )}
            aria-label="User menu"
          >
            <Avatar
              src={user?.photoUrl}
              fallback={user?.name?.charAt(0)}
              alt={user?.name || "User"}
              size="sm"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user?.name || "User"}</span>
              <span className="text-xs font-normal text-text-muted">
                {user?.role || "—"}
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
  );
}
