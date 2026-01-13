import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  /** Unique identifier for the field */
  id: string;
  /** Label text */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** The input element */
  children: React.ReactNode;
}

/**
 * FormField Component
 *
 * Wraps form inputs with consistent Label and error handling.
 * Provides accessible form fields with proper aria attributes.
 *
 * @example
 * <FormField
 *   id="firstName"
 *   label="First Name"
 *   required
 *   error={errors.firstName?.message}
 * >
 *   <Input id="firstName" {...register("firstName")} />
 * </FormField>
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  helperText,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {/* Clone children to add aria attributes */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            "aria-invalid": error ? "true" : undefined,
            "aria-describedby": error
              ? errorId
              : helperText
              ? helperId
              : undefined,
            error: error,
          } as React.HTMLAttributes<HTMLElement>);
        }
        return child;
      })}

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {/* Helper text (only show if no error) */}
      {!error && helperText && (
        <p id={helperId} className="text-sm text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
}
