import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Button variants following Sritek Design System v1.0
 * - Primary: Main action (ONE per screen)
 * - Secondary: Safe/neutral actions
 * - Ghost: Low-priority actions
 * - Destructive: Delete/deactivate actions
 */
const buttonVariants = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-700",
  secondary:
    "bg-bg-surface text-text-primary border border-border-subtle hover:bg-bg-app active:bg-bg-app",
  ghost: "bg-transparent text-text-primary hover:bg-bg-app active:bg-bg-app",
  destructive: "bg-error text-white hover:bg-red-700 active:bg-red-800",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm", // 44px min touch target
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0", // Square icon button
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: keyof typeof buttonVariants;
  /** Button size */
  size?: keyof typeof buttonSizes;
  /** Render as child component (for links styled as buttons) */
  asChild?: boolean;
  /** Loading state - disables button and shows loading indicator */
  isLoading?: boolean;
}

/**
 * Button component
 *
 * Accessibility:
 * - Minimum 44px touch target (size="md" default)
 * - Visible focus ring
 * - Disabled state clearly indicated
 * - Uses verb-based labels ("Save attendance", not "Submit")
 *
 * @example
 * <Button>Add Student</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="secondary" size="sm">Cancel</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2",
          "rounded-lg font-medium",
          "transition-colors duration-150",
          // Focus ring (WCAG AA)
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          // Disabled state
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant and size
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        type="button"
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Loading...</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonSizes };
