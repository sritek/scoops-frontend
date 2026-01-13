"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Eye, EyeOff, HelpCircle } from "lucide-react";

import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  loginFormSchema,
  type LoginFormData,
} from "@/lib/validations/auth";

/**
 * Login Form Component
 *
 * Employee ID + Password authentication:
 * - Enter employee ID and password
 * - Redirects to change password if mustChangePassword is true
 *
 * Features:
 * - Form validation with React Hook Form + Zod
 * - Loading and error states
 * - Password visibility toggle
 */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  // Login form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { employeeId: "", password: "" },
  });

  // Handle login form submission
  const handleLogin = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await login(data.employeeId, data.password);

        if (result.success) {
          // Check if user needs to change password
          if (result.mustChangePassword) {
            router.push("/change-password");
          } else {
            router.push("/");
          }
        } else {
          setError(result.error || "Invalid employee ID or password");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [login, router]
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
          <User className="h-6 w-6 text-primary-600" aria-hidden="true" />
        </div>
        <CardTitle>Login to Scoops</CardTitle>
        <CardDescription>
          Enter your employee ID and password
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

        <form
          onSubmit={form.handleSubmit(handleLogin)}
          className="space-y-4"
        >
          {/* Employee ID Field */}
          <div className="space-y-2">
            <Label htmlFor="employeeId" required>
              Employee ID
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <Input
                id="employeeId"
                type="text"
                placeholder="e.g., XK7R2M"
                autoComplete="username"
                disabled={isLoading}
                className="pl-10"
                error={form.formState.errors.employeeId?.message}
                aria-describedby={
                  form.formState.errors.employeeId ? "employeeId-error" : undefined
                }
                {...form.register("employeeId")}
              />
            </div>
            {form.formState.errors.employeeId && (
              <p id="employeeId-error" className="text-sm text-error" role="alert">
                {form.formState.errors.employeeId.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" required>
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                className="pl-10 pr-10"
                error={form.formState.errors.password?.message}
                aria-describedby={
                  form.formState.errors.password ? "password-error" : undefined
                }
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p id="password-error" className="text-sm text-error" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Sign In
          </Button>

          {/* Forgot Password Link */}
          <button
            type="button"
            onClick={() => setShowForgotDialog(true)}
            className="w-full text-center text-sm text-text-muted hover:text-primary-600 transition-colors"
          >
            Forgot Password?
          </button>
        </form>
      </CardContent>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <HelpCircle className="h-6 w-6 text-primary-600" aria-hidden="true" />
            </div>
            <DialogTitle className="text-center">Reset Your Password</DialogTitle>
            <DialogDescription className="text-center">
              Passwords can only be reset by an administrator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-text-secondary">
              To reset your password, please follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
              <li>Contact your branch administrator</li>
              <li>Provide your Employee ID</li>
              <li>Admin will reset your password</li>
              <li>You&apos;ll receive a temporary password</li>
            </ol>
            <div className="rounded-md bg-bg-app p-3 text-sm text-text-muted">
              <strong className="text-text-secondary">Note:</strong> After receiving your temporary password, you&apos;ll be required to change it on your first login.
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForgotDialog(false)}
              className="w-full sm:w-auto"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
