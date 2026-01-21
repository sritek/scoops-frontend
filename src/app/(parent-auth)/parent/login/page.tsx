import type { Metadata } from "next";
import Link from "next/link";
import { ParentLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Parent Login",
  description: "Login to Scoops Parent Portal with your phone number",
};

/**
 * Parent Login Page
 *
 * OTP-based authentication for parents:
 * - Mobile-first design
 * - Two-step flow (phone → OTP)
 */
export default function ParentLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* App branding */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Scoops</h1>
        <p className="mt-1 text-sm text-text-muted">Parent Portal</p>
      </div>

      {/* Login form */}
      <ParentLoginForm />

      {/* Staff login link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Staff member?{" "}
        <Link
          href="/login"
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
