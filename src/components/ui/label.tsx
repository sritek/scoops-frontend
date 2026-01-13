import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** Mark field as required (shows asterisk) */
  required?: boolean;
}

/**
 * Label component
 *
 * Accessibility:
 * - Uses Radix Label primitive for proper association
 * - Required fields marked with asterisk
 * - Always visible (no placeholder-only inputs)
 *
 * @example
 * <Label htmlFor="name">Student Name</Label>
 * <Label htmlFor="phone" required>Phone Number</Label>
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-text-primary",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  >
    {children}
    {required && (
      <span className="ml-1 text-error" aria-hidden="true">
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

export { Label };
