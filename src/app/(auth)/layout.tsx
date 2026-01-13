import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout for authentication pages (login, etc.)
 * No sidebar, no header - just centered content
 * Uses app background color for clean look
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="min-h-screen bg-bg-app">{children}</main>;
}
