"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const blurStyles = {
  none: "",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
};

export interface LoadingOverlayProps {
  /** Whether to show the overlay */
  isLoading: boolean;
  /** "scoped" covers parent container, "fullPage" covers entire screen */
  variant?: "scoped" | "fullPage";
  /** Optional loading message */
  message?: string;
  /** Blur intensity for backdrop */
  blur?: keyof typeof blurStyles;
  /** Additional class name */
  className?: string;
}

/**
 * LoadingOverlay component for blocking user interactions during async operations
 *
 * @example
 * // Scoped overlay (parent needs position: relative)
 * <div className="relative">
 *   <LoadingOverlay isLoading={isSaving} message="Saving..." />
 *   {content}
 * </div>
 *
 * @example
 * // Full page overlay
 * <LoadingOverlay
 *   isLoading={isProcessing}
 *   variant="fullPage"
 *   message="Processing payment..."
 * />
 */
function LoadingOverlay({
  isLoading,
  variant = "scoped",
  message,
  blur = "sm",
  className,
}: LoadingOverlayProps) {
  const [mounted, setMounted] = React.useState(false);

  // Handle portal mounting for fullPage variant
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoading) return null;

  const overlayContent = (
    <div
      className={cn(
        "flex items-center justify-center bg-white/70 dark:bg-gray-900/70",
        "animate-in fade-in duration-200",
        blurStyles[blur],
        variant === "scoped" && "absolute inset-0 z-50 rounded-lg",
        variant === "fullPage" && "fixed inset-0 z-100",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={message || "Loading"}
    >
      <div className="flex flex-col items-center gap-3 rounded-lg bg-white/90 dark:bg-gray-800/90 p-6 shadow-lg">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-text-primary">{message}</p>
        )}
      </div>
    </div>
  );

  // For fullPage variant, use portal to render at document body
  if (variant === "fullPage") {
    if (!mounted) return null;
    return createPortal(overlayContent, document.body);
  }

  return overlayContent;
}

export { LoadingOverlay };
