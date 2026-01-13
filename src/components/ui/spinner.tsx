import * as React from "react";
import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: keyof typeof spinnerSizes;
  /** Screen reader label */
  label?: string;
}

/**
 * Spinner component for loading states
 *
 * Accessibility:
 * - Uses role="status" for screen readers
 * - Includes sr-only text for loading announcement
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" label="Loading students..." />
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", label = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-primary-600 border-t-transparent",
            spinnerSizes[size]
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

/**
 * Full page loading state
 * Centers spinner in viewport
 *
 * @example
 * <PageLoader />
 * <PageLoader label="Checking authentication..." />
 */
function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" label={label} />
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export { Spinner, PageLoader, spinnerSizes };
