import * as React from "react";
import { ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface AccessDeniedProps {
  /** Custom title (default: "Access Denied") */
  title?: string;
  /** Custom description */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * AccessDenied Component
 *
 * Displays when a user receives a 403 Forbidden error.
 * Use with isForbiddenError() helper from query-client.
 *
 * @example
 * const { error } = useQuery(...);
 * if (isForbiddenError(error)) {
 *   return <AccessDenied />;
 * }
 *
 * @example
 * <AccessDenied
 *   title="Cannot View Students"
 *   description="You need STUDENT_VIEW permission to access this page."
 *   action={<Button onClick={goBack}>Go Back</Button>}
 * />
 */
export function AccessDenied({
  title = "Access Denied",
  description = "You don't have permission to view this content. Contact your administrator if you believe this is an error.",
  action,
  className,
}: AccessDeniedProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-4 rounded-full p-3 bg-red-50 text-error">
        <ShieldX className="h-8 w-8" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="text-lg font-medium text-text-primary">{title}</h2>

      {/* Description */}
      <p className="mt-1 text-sm text-text-muted max-w-sm">{description}</p>

      {/* Action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Full-page AccessDenied variant
 * For use when entire page is inaccessible
 */
export function AccessDeniedPage({
  title = "Access Denied",
  description = "You don't have permission to access this page.",
  onGoBack,
}: {
  title?: string;
  description?: string;
  onGoBack?: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <AccessDenied
        title={title}
        description={description}
        action={
          onGoBack ? (
            <Button variant="secondary" onClick={onGoBack}>
              Go Back
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
