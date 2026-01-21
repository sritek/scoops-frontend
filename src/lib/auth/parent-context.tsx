"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getStoredParentToken,
  storeParentToken,
  clearParentToken,
  getParentMe,
  requestParentOTP,
  verifyParentOTP,
  logoutParent as apiLogoutParent,
} from "@/lib/api/parent";

// Storage key for parent data
const PARENT_KEY = "scoops_parent";

/**
 * Parent data stored in context
 */
export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

/**
 * Parent auth state
 */
export interface ParentAuthState {
  parent: Parent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * OTP request result
 */
export interface OTPRequestResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
  cooldownSeconds?: number;
}

/**
 * OTP verify result
 */
export interface OTPVerifyResult {
  success: boolean;
  message: string;
  error?: string;
}

interface ParentAuthContextValue extends ParentAuthState {
  /** Request OTP for login */
  requestOTP: (phone: string) => Promise<OTPRequestResult>;
  /** Verify OTP and login */
  verifyOTP: (phone: string, otp: string) => Promise<OTPVerifyResult>;
  /** Sign out the parent */
  signOut: () => Promise<void>;
  /** Get the current parent token */
  getToken: () => string | null;
  /** Refresh parent data from server */
  refreshParent: () => Promise<void>;
}

const ParentAuthContext = createContext<ParentAuthContextValue | null>(null);

interface ParentAuthProviderProps {
  children: ReactNode;
}

/**
 * Get stored parent from localStorage
 */
function getStoredParent(): Parent | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(PARENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Parent;
  } catch {
    return null;
  }
}

/**
 * Store parent data in localStorage
 */
function storeParentData(parent: Parent): void {
  localStorage.setItem(PARENT_KEY, JSON.stringify(parent));
}

/**
 * Clear parent data from localStorage
 */
function clearParentData(): void {
  localStorage.removeItem(PARENT_KEY);
}

/**
 * Parent Auth Provider Component
 *
 * Provides parent authentication state to the app:
 * - Uses x-parent-token for API calls
 * - OTP-based login flow
 * - Separate from staff auth
 */
export function ParentAuthProvider({ children }: ParentAuthProviderProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ParentAuthState>({
    parent: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Fetch parent profile from backend
  const fetchParentProfile = useCallback(async (): Promise<Parent | null> => {
    try {
      const response = await getParentMe();
      return response.parent;
    } catch (error) {
      console.error("Failed to fetch parent profile:", error);
      return null;
    }
  }, []);

  // Initialize auth state from stored token
  useEffect(() => {
    async function initAuth() {
      const token = getStoredParentToken();
      const storedParent = getStoredParent();

      if (!token) {
        setState({
          parent: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      // We have a token, try to validate it
      try {
        const parent = await fetchParentProfile();

        if (parent) {
          storeParentData(parent);
          setState({
            parent,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          // Token is invalid, clear it
          clearParentToken();
          clearParentData();
          setState({
            parent: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Parent auth init error:", error);
        // If we have stored data and it's just a network error, use it
        if (storedParent) {
          setState({
            parent: storedParent,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          clearParentToken();
          clearParentData();
          setState({
            parent: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      }
    }

    initAuth();
  }, [fetchParentProfile]);

  // Request OTP handler
  const handleRequestOTP = useCallback(
    async (phone: string): Promise<OTPRequestResult> => {
      try {
        const response = await requestParentOTP(phone);

        return {
          success: response.success,
          message: response.message,
          expiresAt: response.expiresAt
            ? new Date(response.expiresAt)
            : undefined,
          cooldownSeconds: response.cooldownSeconds,
        };
      } catch (error) {
        console.error("Request OTP error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send OTP";
        return {
          success: false,
          message: errorMessage,
        };
      }
    },
    []
  );

  // Verify OTP handler
  const handleVerifyOTP = useCallback(
    async (phone: string, otp: string): Promise<OTPVerifyResult> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await verifyParentOTP(phone, otp);

        if (!response.success || !response.token) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: response.message,
          }));
          return {
            success: false,
            message: response.message,
            error: response.message,
          };
        }

        // Store token - profile will be fetched by initAuth when /parent loads
        storeParentToken(response.token);

        // Don't fetch profile here - initAuth will handle it when the /parent layout mounts
        // This prevents duplicate /me API calls

        return {
          success: true,
          message: "Login successful",
        };
      } catch (error) {
        console.error("Verify OTP error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to verify OTP";

        setState({
          parent: null,
          isLoading: false,
          isAuthenticated: false,
          error: errorMessage,
        });

        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }
    },
    []
  );

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await apiLogoutParent();
    } catch {
      // Ignore errors during logout
    }

    // Clear localStorage
    clearParentToken();
    clearParentData();

    // Clear all cached queries
    queryClient.clear();

    // Reset auth state
    setState({
      parent: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, [queryClient]);

  // Get token function
  const getToken = useCallback((): string | null => {
    return getStoredParentToken();
  }, []);

  // Refresh parent data from server
  const refreshParent = useCallback(async (): Promise<void> => {
    try {
      const parent = await fetchParentProfile();
      if (parent) {
        storeParentData(parent);
        setState((prev) => ({
          ...prev,
          parent,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh parent:", error);
    }
  }, [fetchParentProfile]);

  // Listen for unauthorized events from parent API client
  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("Received parent unauthorized event - signing out");
      handleSignOut();
    };

    window.addEventListener("parent-auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener(
        "parent-auth:unauthorized",
        handleUnauthorized
      );
    };
  }, [handleSignOut]);

  const value: ParentAuthContextValue = {
    ...state,
    requestOTP: handleRequestOTP,
    verifyOTP: handleVerifyOTP,
    signOut: handleSignOut,
    getToken,
    refreshParent,
  };

  return (
    <ParentAuthContext.Provider value={value}>
      {children}
    </ParentAuthContext.Provider>
  );
}

/**
 * Hook to access parent auth context
 *
 * Provides:
 * - parent: Current parent object or null
 * - isLoading: True while checking auth state
 * - isAuthenticated: True if parent is logged in
 * - error: Error message if auth failed
 * - requestOTP: Function to request OTP
 * - verifyOTP: Function to verify OTP and login
 * - signOut: Function to sign out
 * - getToken: Function to get current parent token
 * - refreshParent: Function to refresh parent data from server
 *
 * Must be used within ParentAuthProvider
 *
 * @example
 * const { parent, isAuthenticated, requestOTP, verifyOTP, signOut } = useParentAuth();
 */
export function useParentAuth(): ParentAuthContextValue {
  const context = useContext(ParentAuthContext);

  if (!context) {
    throw new Error("useParentAuth must be used within a ParentAuthProvider");
  }

  return context;
}
