"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/api/query-client";
import { AuthProvider } from "@/lib/auth";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * App-wide Providers
 *
 * Wraps the application with:
 * - QueryClientProvider for TanStack Query (data fetching)
 * - ThemeProvider for dark mode support
 * - AuthProvider for authentication state
 *
 * Query client includes:
 * - Global error handling for 401/403 errors
 * - Consistent retry and stale time settings
 *
 * Theme provider:
 * - Uses class strategy (adds .dark to <html>)
 * - Respects system preference
 * - Persists preference to localStorage
 *
 * Auth is available globally via useAuth() hook.
 */
export function Providers({ children }: ProvidersProps) {
  // Create query client once with global error handling
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
