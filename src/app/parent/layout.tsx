"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useParentAuth, ParentAuthProvider } from "@/lib/auth";
import { PageLoader } from "@/components/ui";
import { ParentAppShell } from "@/components/layout";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";
import { createQueryClient } from "@/lib/api/query-client";

interface ParentLayoutProps {
  children: ReactNode;
}

/**
 * Parent Portal Layout Content
 *
 * Handles authentication checks and renders ParentAppShell.
 * Responsive layout with:
 * - Desktop: Sidebar + top header
 * - Mobile: Mobile header + bottom navigation
 */
function ParentLayoutContent({ children }: ParentLayoutProps) {
  const { isAuthenticated, isLoading, error } = useParentAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/parent/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return <PageLoader label="Loading..." />;
  }

  // Show error state
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => router.replace("/parent/login")}
            className="text-primary-600 hover:text-primary-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return <PageLoader label="Redirecting to login..." />;
  }

  // Authenticated - render with ParentAppShell
  return <ParentAppShell>{children}</ParentAppShell>;
}

/**
 * Parent Portal Layout
 *
 * Wraps with providers and authentication:
 * - QueryClientProvider
 * - ThemeProvider
 * - ParentAuthProvider
 * - Auth check and redirect
 */
export default function ParentLayout({ children }: ParentLayoutProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ParentAuthProvider>
          <ParentLayoutContent>{children}</ParentLayoutContent>
        </ParentAuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
