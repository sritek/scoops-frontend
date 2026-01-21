import * as React from "react";
import { cn } from "@/lib/utils";

const spinnerSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
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
 * Radix-inspired 8-leaf design with staggered opacity animation.
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
          className={cn("relative text-text-primary", spinnerSizes[size])}
          aria-hidden="true"
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-0 h-[30%] w-[12%] -translate-x-1/2 rounded-full bg-text-primary"
              style={{
                transform: `rotate(${i * 45}deg)`,
                transformOrigin: "center 170%",
                opacity: 0.15 + i * 0.1,
                animation: "spinner-leaf 0.8s linear infinite",
                animationDelay: `${-i * 0.1}s`,
              }}
            />
          ))}
        </div>
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
