import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display */
  error?: string;
}

/**
 * Input component
 *
 * Accessibility:
 * - Visible focus ring
 * - Error state with aria-invalid and aria-describedby
 * - Always use with Label component
 * - Minimum 44px height for touch targets
 *
 * @example
 * <Label htmlFor="name" required>Name</Label>
 * <Input id="name" placeholder="Enter student name" />
 *
 * // With error
 * <Input id="phone" error="Phone number is required" aria-describedby="phone-error" />
 * <span id="phone-error" className="text-error text-sm">Phone number is required</span>
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-lg",
          "border border-border-subtle bg-bg-surface",
          "px-3 py-2 text-sm text-text-primary",
          // Placeholder
          "placeholder:text-text-muted",
          // Focus state (WCAG AA)
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0",
          "focus-visible:border-primary-600",
          // Error state
          error && "border-error focus-visible:border-error focus-visible:outline-error",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-app",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
