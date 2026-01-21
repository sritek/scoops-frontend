/**
 * Staff API Client
 *
 * API client for staff (admin, teachers, accounts) with Bearer token authentication.
 */

import { ApiClient, createTokenHelpers } from "./base-client";
import { config } from "@/config";

const TOKEN_KEY = "scoops_token";

// Token management helpers
export const { getStoredToken, storeToken, clearToken } =
  createTokenHelpers(TOKEN_KEY);

// Staff API client instance
export const apiClient = new ApiClient(config.api.baseUrl, {
  tokenKey: TOKEN_KEY,
  headerName: "Authorization",
  headerPrefix: "Bearer ",
  unauthorizedEvent: "auth:unauthorized",
});
