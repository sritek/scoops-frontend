/**
 * Base API Client
 *
 * Configurable API client class that can be used for both
 * staff (Bearer token) and parent (x-parent-token) authentication.
 */

import type { ApiError } from "@/types";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth header (for public endpoints like login/OTP) */
  skipAuth?: boolean;
}

export interface ApiClientConfig {
  /** localStorage key for storing the token */
  tokenKey: string;
  /** HTTP header name for auth (e.g., 'Authorization' or 'x-parent-token') */
  headerName: string;
  /** Prefix for the token value (e.g., 'Bearer ' or '') */
  headerPrefix: string;
  /** Custom event name to dispatch on 401 unauthorized */
  unauthorizedEvent: string;
}

/**
 * Configurable API Client
 *
 * Handles HTTP requests with automatic token injection,
 * error handling, and typed responses.
 */
export class ApiClient {
  constructor(
    private baseUrl: string,
    private config: ApiClientConfig
  ) {}

  private getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.config.tokenKey);
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
      const token = this.getStoredToken();
      if (token) {
        requestHeaders[this.config.headerName] =
          `${this.config.headerPrefix}${token}`;
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
      error.message = "Session expired. Please log in again.";
      // Dispatch custom event for auth context to handle
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(this.config.unauthorizedEvent));
      }
    } else if (response.status === 403) {
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

/**
 * Token Helper Factory
 *
 * Creates token management functions for a given storage key.
 */
export function createTokenHelpers(tokenKey: string) {
  return {
    getStoredToken: (): string | null => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(tokenKey);
    },
    storeToken: (token: string): void => {
      localStorage.setItem(tokenKey, token);
    },
    clearToken: (): void => {
      localStorage.removeItem(tokenKey);
    },
  };
}
