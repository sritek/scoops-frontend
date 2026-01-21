import type { ReactNode } from "react";
import { ParentAuthProviders } from "./providers";

interface ParentAuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout for parent authentication pages
 * Centered content with app branding
 */
export default function ParentAuthLayout({ children }: ParentAuthLayoutProps) {
  return (
    <ParentAuthProviders>
      <main className="min-h-screen bg-bg-app">{children}</main>
    </ParentAuthProviders>
  );
}
