import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action (e.g., button) */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Empty State Component
 *
 * Displays when a list or section has no data.
 * Follows UX best practices with clear messaging and optional CTA.
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   title="No students found"
 *   description="Add your first student to get started"
 *   action={<Button>Add Student</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-label={description ? `${title}. ${description}` : title}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 rounded-full p-3",
            "bg-bg-app text-text-muted"
          )}
        >
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-medium text-text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-text-muted max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
