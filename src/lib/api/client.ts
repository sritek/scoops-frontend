import { config } from "@/config";
import type { ApiError } from "@/types";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Storage key for auth token
const TOKEN_KEY = "scoops_token";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  // Skip auth header (for public endpoints like login)
  skipAuth?: boolean;
}

/**
 * Get stored token from localStorage
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * API client with automatic auth token injection
 * Handles errors and provides typed responses
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = "GET", body, headers = {}, skipAuth = false } = options;

    // Build headers
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    // Only set Content-Type when there's a body
    if (body && method !== "GET") {
      requestHeaders["Content-Type"] = "application/json";
    }

    // Add auth token if available and not skipped
    if (!skipAuth) {
      const token = getStoredToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    // Build request
    const url = `${this.baseUrl}${endpoint}`;
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      requestInit.body = JSON.stringify(body);
    }

    // Execute request
    const response = await fetch(url, requestInit);

    // Handle errors
    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    // Parse response
    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async handleError(response: Response): Promise<ApiError> {
    let message = "An unexpected error occurred";
    let code: string | undefined;

    try {
      const errorData = await response.json();
      message = errorData.message || message;
      code = errorData.code;
    } catch {
      // Response body is not JSON
      message = response.statusText || message;
    }

    const error: ApiError = {
      message,
      code,
      statusCode: response.status,
    };

    // Handle specific status codes
    if (response.status === 401) {
      // Unauthorized - token expired or invalid
      error.message = "Session expired. Please log in again.";
      // Dispatch event for auth context to handle
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    } else if (response.status === 403) {
      // Forbidden - no permission
      error.message = "You do not have permission to perform this action.";
    } else if (response.status === 404) {
      error.message = "The requested resource was not found.";
    } else if (response.status >= 500) {
      error.message = "Server error. Please try again later.";
    }

    return error;
  }

  // HTTP method shortcuts
  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method">
  ) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  async delete<T>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient(config.api.baseUrl);
