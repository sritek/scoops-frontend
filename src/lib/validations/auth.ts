import { z } from "zod";

/**
 * Employee ID validation schema
 * Accepts alphanumeric employee IDs (e.g., "XK7R2M")
 */
export const employeeIdSchema = z
  .string()
  .min(1, "Employee ID is required")
  .max(20, "Employee ID is too long");

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required");

/**
 * New password validation schema (with strength requirements)
 */
export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

/**
 * Login form schema
 */
export const loginFormSchema = z.object({
  employeeId: employeeIdSchema,
  password: passwordSchema,
});

/**
 * Change password form schema
 */
export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: newPasswordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;
