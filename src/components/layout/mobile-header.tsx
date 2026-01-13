"use client";

import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { appMeta } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
              "flex h-8 w-8 items-center justify-center",
              "rounded-full bg-primary-100",
              "text-sm font-medium text-primary-600",
              "focus-visible:outline-2 focus-visible:outline-ring"
            )}
            aria-label="User menu"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
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
