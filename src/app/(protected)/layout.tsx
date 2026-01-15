"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoader } from "@/components/ui";
import { AppShell } from "@/components/layout";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Protected Layout
 *
 * Wraps all protected routes with:
 * - Redirect to login if unauthenticated
 * - Loading state while session resolves
 * - AppShell with sidebar navigation
 *
 * All routes under (protected) require authentication.
 * AuthProvider is at the root level in providers.tsx
 * Session is available globally via useAuth() hook.
 * Permissions are available via usePermissions() hook.
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return <PageLoader label="Checking authentication..." />;
  }

  // Show error state if auth failed
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="text-primary-600 hover:text-primary-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return <PageLoader label="Redirecting to login..." />;
  }

  // Authenticated - render with AppShell
  return <AppShell>{children}</AppShell>;
}
