import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge variants following Sritek Design System v1.0
 *
 * ⚠️ Never rely on color alone - badges include text
 * - Success: Green (#16A34A) - Paid, Present, Active
 * - Warning: Amber (#D97706) - Pending, Due soon
 * - Error: Red (#DC2626) - Failed, Absent, Overdue
 * - Default: Gray - Neutral status
 */
const badgeVariants = {
  default: "bg-bg-app text-text-muted border-border-subtle",
  success: "bg-green-50 text-success border-green-200",
  warning: "bg-amber-50 text-warning border-amber-200",
  error: "bg-red-50 text-error border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge style variant */
  variant?: keyof typeof badgeVariants;
}

/**
 * Badge component for status indicators
 *
 * Accessibility:
 * - Always includes text (never color-only)
 * - Sufficient contrast ratios
 *
 * @example
 * <Badge variant="success">Paid</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Overdue</Badge>
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center",
          "rounded border px-2 py-0.5",
          "text-xs font-medium",
          // Variant
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
