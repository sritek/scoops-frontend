import * as React from "react";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User, AuthState } from "@/types";
import { mockAuthStates, type MockAuthState } from "./mocks/auth";

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Mock Auth Context for testing
 */
interface MockAuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<MockAuthContextValue | null>(null);

interface MockAuthProviderProps {
  children: React.ReactNode;
  authState?: MockAuthState;
}

/**
 * Mock AuthProvider for testing
 */
function MockAuthProvider({
  children,
  authState = mockAuthStates.authenticatedAdmin,
}: MockAuthProviderProps) {
  const value: MockAuthContextValue = {
    ...authState,
    signOut: async () => {
      // Mock sign out - does nothing in tests
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Mock useAuth hook for testing
 */
export function useMockAuth(): MockAuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within MockAuthProvider");
  }
  return context;
}

/**
 * All providers wrapper for testing
 */
interface AllProvidersProps {
  children: React.ReactNode;
  authState?: MockAuthState;
  queryClient?: QueryClient;
}

function AllProviders({ children, authState, queryClient }: AllProvidersProps) {
  const client = queryClient ?? createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <MockAuthProvider authState={authState}>{children}</MockAuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** Auth state to use (defaults to authenticated admin) */
  authState?: MockAuthState;
  /** Query client to use (creates new one if not provided) */
  queryClient?: QueryClient;
}

/**
 * Custom render function with all providers
 *
 * @example
 * // Render as admin (default)
 * const { getByRole } = renderWithProviders(<MyComponent />);
 *
 * // Render as teacher
 * const { getByRole } = renderWithProviders(<MyComponent />, {
 *   authState: mockAuthStates.authenticatedTeacher,
 * });
 *
 * // Render as unauthenticated
 * const { getByRole } = renderWithProviders(<MyComponent />, {
 *   authState: mockAuthStates.unauthenticated,
 * });
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const {
    authState,
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders authState={authState} queryClient={queryClient}>
      {children}
    </AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Re-export testing utilities
 */
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
export { mockAuthStates } from "./mocks/auth";
export {
  createMockAdminUser,
  createMockTeacherUser,
  createMockAccountsUser,
  createMockStaffUser,
  createMockUserWithPermissions,
} from "./mocks/auth";
