import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import type { ApiError } from "@/types";

/**
 * Check if error is an API error with specific status code
 */
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as ApiError).statusCode === "number"
  );
}

/**
 * Global error handler for API errors
 * Called for all query and mutation errors
 */
function handleGlobalError(error: unknown): void {
  if (!isApiError(error)) {
    console.error("Non-API error:", error);
    return;
  }

  // 401 Unauthorized - Session expired or invalid
  // The auth context will handle redirect when it detects no user
  if (error.statusCode === 401) {
    console.warn("Unauthorized - session may have expired");
    // Dispatch custom event that AuthProvider can listen to
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
  }

  // 403 Forbidden - No permission
  // Let components handle this via error state
  if (error.statusCode === 403) {
    console.warn("Forbidden - insufficient permissions");
  }

  // Network or server errors
  if (error.statusCode >= 500) {
    console.error("Server error:", error.message);
  }
}

/**
 * Create a configured QueryClient with global error handling
 *
 * Features:
 * - 401 errors dispatch "auth:unauthorized" event for sign out
 * - 403 errors are passed to components for AccessDenied display
 * - Consistent retry and stale time settings
 *
 * @example
 * const queryClient = createQueryClient();
 * <QueryClientProvider client={queryClient}>...</QueryClientProvider>
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only handle errors for queries that have already been successful before
        // This prevents showing errors on initial load failures (let component handle those)
        if (query.state.data !== undefined) {
          handleGlobalError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleGlobalError(error);
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time of 1 minute
        staleTime: 60 * 1000,
        // Don't retry on 401/403 (auth errors)
        retry: (failureCount, error) => {
          if (isApiError(error) && [401, 403, 404].includes(error.statusCode)) {
            return false;
          }
          return failureCount < 1;
        },
        // Don't refetch on window focus for better UX
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Don't retry mutations on auth errors
        retry: (failureCount, error) => {
          if (isApiError(error) && [401, 403].includes(error.statusCode)) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
}

/**
 * Helper to check if a query error is a 403 Forbidden
 * Use in components to conditionally render AccessDenied
 *
 * @example
 * const { error } = useQuery(...);
 * if (isForbiddenError(error)) {
 *   return <AccessDenied />;
 * }
 */
export function isForbiddenError(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 403;
}

/**
 * Helper to check if a query error is a 401 Unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 401;
}

/**
 * Helper to check if a query error is a 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 404;
}

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
