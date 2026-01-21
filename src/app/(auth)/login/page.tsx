import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Login to Scoops with your employee credentials",
};

/**
 * Login Page
 *
 * Phone OTP authentication for Scoops
 * - Mobile-first design
 * - Two-step flow (phone → OTP)
 * - Token stored in memory only
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* App branding */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Scoops</h1>
        <p className="mt-1 text-sm text-text-muted">
          School Operations Platform
        </p>
      </div>

      {/* Login form */}
      <LoginForm />

      {/* Parent login link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Are you a parent?{" "}
        <Link
          href="/parent/login"
          className="text-primary-600 hover:text-primary-700 hover:underline"
        >
          Login here
        </Link>
      </p>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-text-muted">
        By logging in, you agree to our Terms of Service
      </p>
    </div>
  );
}
