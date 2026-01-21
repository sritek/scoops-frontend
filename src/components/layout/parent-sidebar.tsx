"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { parentNavItems, parentAppMeta } from "@/config/parent-navigation";

interface ParentSidebarProps {
  /** Whether sidebar is open (mobile only) */
  isOpen?: boolean;
  /** Callback to close sidebar (mobile only) */
  onClose?: () => void;
}

/**
 * Parent Sidebar Navigation Component
 *
 * Desktop: Fixed sidebar (240px)
 * Mobile: Slide-out drawer with overlay
 *
 * Features:
 * - All parent nav items visible (no permission filtering)
 * - Active route highlighting
 * - Keyboard accessible (Escape to close, focus management)
 */
export function ParentSidebar({ isOpen = false, onClose }: ParentSidebarProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close sidebar
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Focus close button when sidebar opens (mobile)
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Add/remove Escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          "fixed top-0 left-0 z-50 h-full w-60 bg-bg-surface",
          "border-r border-border-subtle",
          "flex flex-col",
          // Mobile: slide in/out
          "transition-transform duration-200 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Parent navigation"
        // Mobile dialog attributes for accessibility
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? "true" : undefined}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
          <Link
            href="/parent"
            className="flex items-center gap-2 font-semibold text-text-primary"
          >
            <span className="text-lg">{parentAppMeta.name}</span>
          </Link>

          {/* Mobile close button */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={cn(
              "rounded p-1.5 md:hidden",
              "text-text-muted hover:text-text-primary",
              "hover:bg-bg-app",
              "focus-visible:outline-2 focus-visible:outline-ring"
            )}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1" role="list">
            {parentNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/parent" && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      // Base styles
                      "flex items-center gap-3 rounded-lg px-3 py-2.5",
                      "text-sm font-medium transition-colors",
                      // Focus state
                      "focus-visible:outline-2 focus-visible:outline-ring",
                      // Active/inactive states
                      isActive
                        ? "bg-primary-100 text-primary-600"
                        : "text-text-muted hover:bg-bg-app hover:text-text-primary"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border-subtle p-4">
          <p className="text-xs text-text-muted">{parentAppMeta.tagline}</p>
        </div>
      </aside>
    </>
  );
}
