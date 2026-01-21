/**
 * Parent API Client
 *
 * API client for parents with x-parent-token header authentication.
 * Separate from staff client to maintain clear auth boundaries.
 */

import { ApiClient, createTokenHelpers } from "./base-client";
import { config } from "@/config";

const PARENT_TOKEN_KEY = "scoops_parent_token";

// Token management helpers
export const {
  getStoredToken: getStoredParentToken,
  storeToken: storeParentToken,
  clearToken: clearParentToken,
} = createTokenHelpers(PARENT_TOKEN_KEY);

// Parent API client instance
export const parentApiClient = new ApiClient(config.api.baseUrl, {
  tokenKey: PARENT_TOKEN_KEY,
  headerName: "x-parent-token",
  headerPrefix: "",
  unauthorizedEvent: "parent-auth:unauthorized",
});
