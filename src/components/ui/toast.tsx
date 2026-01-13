import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

/**
 * Toast Viewport
 * Container for all toasts, positioned bottom-right
 */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4",
      "sm:bottom-4 sm:right-4 sm:flex-col sm:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

/**
 * Toast variants
 */
const toastVariants = {
  default:
    "border-border-subtle bg-bg-surface text-text-primary",
  success:
    "border-green-200 bg-green-50 text-success",
  warning:
    "border-amber-200 bg-amber-50 text-warning",
  error:
    "border-red-200 bg-red-50 text-error",
};

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: keyof typeof toastVariants;
}

/**
 * Toast component
 * For showing notifications
 *
 * @example
 * <Toast variant="success">
 *   <ToastTitle>Success</ToastTitle>
 *   <ToastDescription>Student added successfully</ToastDescription>
 * </Toast>
 */
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        // Base styles
        "group pointer-events-auto relative flex w-full items-center justify-between",
        "space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg",
        // Animation
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full",
        "data-[state=open]:sm:slide-in-from-bottom-full",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
        "data-[state=closed]:slide-out-to-right-full",
        "data-[swipe=cancel]:translate-x-0",
        "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=move]:transition-none",
        // Variant
        toastVariants[variant],
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

/**
 * Toast Action
 * Optional action button in toast
 */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center",
      "rounded-lg border border-border-subtle",
      "bg-transparent px-3 text-sm font-medium",
      "hover:bg-bg-app",
      "focus-visible:outline-2 focus-visible:outline-ring",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

/**
 * Toast Close Button
 *
 * Accessibility: Always visible (opacity-50) so keyboard users can see it.
 * Increases opacity on hover/focus for better visibility.
 */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded p-1",
      "text-text-muted hover:text-text-primary",
      // Always visible for keyboard users, more prominent on hover/focus
      "opacity-50 hover:opacity-100",
      "focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
      className
    )}
    toast-close=""
    aria-label="Close"
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

/**
 * Toast Title
 */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-medium", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

/**
 * Toast Description
 */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
};
