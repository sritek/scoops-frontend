import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {}

/**
 * Checkbox component
 *
 * Accessibility:
 * - Uses Radix Checkbox primitive
 * - Keyboard navigable (Space to toggle)
 * - Visible focus ring
 * - 44px minimum touch target (WCAG 2.5.5)
 * - Always use with Label
 *
 * @example
 * <div className="flex items-center gap-2">
 *   <Checkbox id="agree" />
 *   <Label htmlFor="agree">I agree to terms</Label>
 * </div>
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    type="button" // Prevents form submission when Checkbox is inside a form
    className={cn(
      // Base styles - visual size 20px, touch target 44px via padding
      "peer relative h-5 w-5 shrink-0",
      "rounded border border-border-subtle",
      "bg-bg-surface",
      // Extended touch target (44px) using ::before pseudo-element
      "before:absolute before:-inset-3 before:content-['']",
      // Focus state (WCAG AA)
      "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
      // Checked state
      "data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600",
      "data-[state=checked]:text-white",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
