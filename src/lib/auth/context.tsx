"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { apiClient } from "@/lib/api/client";
import type { User, AuthState } from "@/types";

// Storage keys
const TOKEN_KEY = "scoops_token";
const USER_KEY = "scoops_user";

interface LoginResult {
  success: boolean;
  mustChangePassword?: boolean;
  error?: string;
}

interface AuthContextValue extends AuthState {
  /** Login with employee ID and password */
  login: (employeeId: string, password: string) => Promise<LoginResult>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Change password */
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Get the current auth token */
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Get stored token from localStorage
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user from localStorage
 */
function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

/**
 * Store auth data in localStorage
 */
function storeAuthData(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data from localStorage
 */
function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Auth Provider Component
 *
 * Provides authentication state to the app:
 * - Stores JWT token in localStorage
 * - Checks token validity on app load
 * - Fetches user profile from backend
 *
 * For permission checks, use the usePermissions hook instead.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Fetch user profile from backend
  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      const user = await apiClient.get<User>("/auth/me");
      return user;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (!token) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      // We have a token, try to validate it by fetching user profile
      try {
        const user = await fetchUserProfile();

        if (user) {
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          // Token is invalid, clear it
          clearAuthData();
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth init error:", error);
        // If we have a stored user and it's just a network error, use stored data
        if (storedUser) {
          setState({
            user: storedUser,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          clearAuthData();
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    }

    initAuth();
  }, [fetchUserProfile]);

  // Login handler
  const login = useCallback(
    async (employeeId: string, password: string): Promise<LoginResult> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        interface LoginResponse {
          token: string;
          user: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            role: string;
            permissions: string[];
            branchId: string;
            orgId: string;
            mustChangePassword: boolean;
          };
        }

        const response = await apiClient.post<LoginResponse>(
          "/auth/login",
          {
            employeeId,
            password,
          },
          { skipAuth: true }
        );

        // Build user object from response
        const user: User = {
          id: response.user.id,
          name: `${response.user.firstName} ${response.user.lastName}`.trim(),
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          role: response.user.role as User["role"],
          permissions: response.user.permissions as User["permissions"],
          branchId: response.user.branchId,
          organizationId: response.user.orgId,
        };

        // Store auth data
        storeAuthData(response.token, user);

        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        return {
          success: true,
          mustChangePassword: response.user.mustChangePassword,
        };
      } catch (error) {
        console.error("Login error:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Invalid employee ID or password";

        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    clearAuthData();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // Change password handler
  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await apiClient.post("/auth/change-password", {
          currentPassword,
          newPassword,
          confirmPassword,
        });

        return { success: true };
      } catch (error) {
        console.error("Change password error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to change password";
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Get token function
  const getToken = useCallback((): string | null => {
    return getStoredToken();
  }, []);

  // Listen for unauthorized events from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("Received unauthorized event - signing out");
      handleSignOut();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [handleSignOut]);

  const value: AuthContextValue = {
    ...state,
    login,
    signOut: handleSignOut,
    changePassword,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 *
 * Provides:
 * - user: Current user object or null
 * - isLoading: True while checking auth state
 * - isAuthenticated: True if user is logged in
 * - error: Error message if auth failed
 * - login: Function to login with employee ID and password
 * - signOut: Function to sign out
 * - changePassword: Function to change password
 * - getToken: Function to get current auth token
 *
 * For permission checks, use usePermissions hook instead.
 *
 * Must be used within AuthProvider
 *
 * @example
 * const { user, isAuthenticated, login, signOut } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
