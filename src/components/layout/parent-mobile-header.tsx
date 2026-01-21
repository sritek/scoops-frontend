"use client";

import Link from "next/link";
import { Menu, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParentAuth } from "@/lib/auth";
import { parentAppMeta } from "@/config/parent-navigation";
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

interface ParentMobileHeaderProps {
  /** Callback to open sidebar */
  onMenuClick: () => void;
}

/**
 * Parent Mobile Header Component
 *
 * Shown only on mobile (<768px)
 * Contains hamburger menu, app title, and user menu
 */
export function ParentMobileHeader({ onMenuClick }: ParentMobileHeaderProps) {
  const { parent, signOut } = useParentAuth();

  const parentName = parent
    ? `${parent.firstName} ${parent.lastName}`
    : "Parent";
  const parentInitial = parent?.firstName?.charAt(0) || "P";

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
      <h1 className="font-semibold text-text-primary">{parentAppMeta.name}</h1>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn("focus-visible:outline-2 focus-visible:outline-ring")}
            aria-label="User menu"
          >
            <Avatar fallback={parentInitial} alt={parentName} size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{parentName}</span>
              <span className="text-xs font-normal text-text-muted">
                {parent?.phone || "—"}
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
  );
}
