"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  changePasswordFormSchema,
  type ChangePasswordFormData,
} from "@/lib/validations/auth";

/**
 * Change Password Page
 *
 * Allows users to change their password:
 * - Required on first login when mustChangePassword is true
 * - Available anytime from settings
 *
 * Features:
 * - Form validation with React Hook Form + Zod
 * - Password strength requirements
 * - Password visibility toggles
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword } = useAuth();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: ChangePasswordFormData) => {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const result = await changePassword(
          data.currentPassword,
          data.newPassword,
          data.confirmPassword
        );

        if (result.success) {
          setSuccess(true);
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          setError(result.error || "Failed to change password");
        }
      } catch (err) {
        console.error("Change password error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [changePassword, router]
  );

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h2 className="mb-2 text-lg font-semibold">Password Changed Successfully</h2>
              <p className="text-text-muted">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Lock className="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Please create a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error message */}
          {error && (
            <div
              className="mb-4 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Password requirements */}
          <div className="mb-4 rounded-sm border border-border-subtle bg-bg-app p-3 text-sm text-text-muted">
            <p className="font-medium text-text-primary mb-1">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 8 characters</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
            </ul>
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Current Password Field */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" required>
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="pl-10 pr-10"
                  error={form.formState.errors.currentPassword?.message}
                  {...form.register("currentPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-error" role="alert">
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" required>
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="pl-10 pr-10"
                  error={form.formState.errors.newPassword?.message}
                  {...form.register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.newPassword && (
                <p className="text-sm text-error" role="alert">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" required>
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="pl-10 pr-10"
                  error={form.formState.errors.confirmPassword?.message}
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-error" role="alert">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
