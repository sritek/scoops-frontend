"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { createQueryClient } from "@/lib/api/query-client";
import { ParentAuthProvider } from "@/lib/auth";

interface ParentAuthProvidersProps {
  children: ReactNode;
}

/**
 * Parent Auth Providers
 *
 * Provides context for parent auth pages (login):
 * - QueryClientProvider for TanStack Query
 * - ThemeProvider for dark mode support
 * - ParentAuthProvider for parent authentication
 */
export function ParentAuthProviders({ children }: ParentAuthProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ParentAuthProvider>{children}</ParentAuthProvider>
        <Toaster
          position="bottom-right"
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
