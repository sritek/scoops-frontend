import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const statCardVariants = {
  default: "bg-bg-surface border-border-subtle",
  success: "bg-green-50 border-green-200",
  warning: "bg-amber-50 border-amber-200",
  error: "bg-red-50 border-red-200",
};

const statCardIconVariants = {
  default: "bg-bg-app text-text-muted",
  success: "bg-green-100 text-success",
  warning: "bg-amber-100 text-warning",
  error: "bg-red-100 text-error",
};

const statCardValueVariants = {
  default: "text-text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export interface StatCardProps {
  /** Stat label/title */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional secondary value (e.g., "of 60") */
  subValue?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Visual variant */
  variant?: keyof typeof statCardVariants;
  /** Additional class names */
  className?: string;
}

/**
 * Stat Card Component
 *
 * Displays a single statistic with label, value, and optional icon.
 * Used for dashboard metrics.
 *
 * @example
 * <StatCard label="Present" value={45} icon={UserCheck} variant="success" />
 * <StatCard label="Pending" value="₹45,000" subValue="15 fees" variant="warning" />
 */
export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        statCardVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-text-muted">{label}</p>
          <p
            className={cn(
              "text-2xl font-semibold",
              statCardValueVariants[variant]
            )}
          >
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-text-muted">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-lg p-2",
              statCardIconVariants[variant]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Skeleton for loading state
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle",
        "bg-bg-surface p-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-bg-app" />
          <div className="h-8 w-16 animate-pulse rounded bg-bg-app" />
        </div>
        <div className="h-9 w-9 animate-pulse rounded-lg bg-bg-app" />
      </div>
    </div>
  );
}
