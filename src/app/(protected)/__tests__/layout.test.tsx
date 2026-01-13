import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMockAdminUser } from "@/test/mocks/auth";

// Mock router
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock auth state
const mockAuthState = vi.fn();
vi.mock("@/lib/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthState(),
}));

// Simple mock for AppShell
vi.mock("@/components/layout", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

// Import after mocks
import ProtectedLayout from "../layout";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("ProtectedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication redirects", () => {
    it("redirects to login when user is not authenticated", async () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login");
      });
    });

    it("does not redirect when user is authenticated", async () => {
      mockAuthState.mockReturnValue({
        user: createMockAdminUser(),
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      // Wait a tick to ensure effect has run
      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });

      // Content should be rendered
      expect(screen.getByTestId("app-shell")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Loading states", () => {
    it("shows loading state while checking authentication", () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      // Use getAllByText since there are multiple matching elements (sr-only + visible)
      const loadingTexts = screen.getAllByText(/checking authentication/i);
      expect(loadingTexts.length).toBeGreaterThan(0);
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("shows redirecting state when not authenticated", () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      // Use getAllByText since there are multiple matching elements (sr-only + visible)
      const redirectingTexts = screen.getAllByText(/redirecting to login/i);
      expect(redirectingTexts.length).toBeGreaterThan(0);
    });
  });

  describe("Error states", () => {
    it("shows error state with link to login", () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Session expired",
      });

      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText("Session expired")).toBeInTheDocument();
      expect(screen.getByText(/go to login/i)).toBeInTheDocument();
    });
  });

  describe("Route inaccessibility without auth", () => {
    it("does not render children when not authenticated", () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div data-testid="secret-content">Secret Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId("secret-content")).not.toBeInTheDocument();
    });

    it("does not render children while loading", () => {
      mockAuthState.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
      });

      render(
        <ProtectedLayout>
          <div data-testid="secret-content">Secret Content</div>
        </ProtectedLayout>,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId("secret-content")).not.toBeInTheDocument();
    });
  });
});
