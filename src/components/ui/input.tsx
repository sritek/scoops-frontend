import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display */
  error?: string;
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode;
  /** Text prefix (e.g., "$", "+91") */
  prefix?: string;
  /** Text suffix (e.g., "kg", "%") */
  suffix?: string;
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
 *
 * // With left icon
 * <Input leftIcon={<Search className="h-4 w-4" />} placeholder="Search..." />
 *
 * // With prefix
 * <Input prefix="+91" placeholder="Phone number" />
 *
 * // With suffix
 * <Input suffix="kg" placeholder="Weight" type="number" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      leftIcon,
      rightIcon,
      prefix,
      suffix,
      ...props
    },
    ref
  ) => {
    const hasAddons = leftIcon || rightIcon || prefix || suffix;

    const inputClasses = cn(
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
      error &&
        "border-error focus-visible:border-error focus-visible:outline-error",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-bg-app",
      // File input
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      // Adjust padding for icons/prefix/suffix
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      prefix && "pl-12",
      suffix && "pr-12",
      className
    );

    const inputElement = (
      <input
        type={type}
        className={inputClasses}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );

    if (!hasAddons) {
      return inputElement;
    }

    return (
      <div className="relative flex items-center w-full">
        {/* Prefix text */}
        {prefix && (
          <span className="absolute left-0 flex items-center justify-center h-11 px-3 text-sm text-text-muted border-r border-border-subtle bg-bg-app rounded-l-lg">
            {prefix}
          </span>
        )}

        {/* Left icon */}
        {leftIcon && !prefix && (
          <span className="absolute left-3 flex items-center text-text-muted pointer-events-none">
            {leftIcon}
          </span>
        )}

        {inputElement}

        {/* Right icon */}
        {rightIcon && !suffix && (
          <span className="absolute right-3 flex items-center text-text-muted pointer-events-none">
            {rightIcon}
          </span>
        )}

        {/* Suffix text */}
        {suffix && (
          <span className="absolute right-0 flex items-center justify-center h-11 px-3 text-sm text-text-muted border-l border-border-subtle bg-bg-app rounded-r-lg">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
