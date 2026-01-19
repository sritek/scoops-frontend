/**
 * Analytics API Client
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  BranchComparison,
  BranchPerformance,
  OrgStats,
} from "@/types/analytics";

// Query keys
export const analyticsKeys = {
  all: ["analytics"] as const,
  branchComparison: () => [...analyticsKeys.all, "branchComparison"] as const,
  branchPerformance: (id: string) =>
    [...analyticsKeys.all, "branchPerformance", id] as const,
  orgStats: () => [...analyticsKeys.all, "orgStats"] as const,
};

/**
 * Fetch branch comparison
 */
async function fetchBranchComparison(): Promise<BranchComparison> {
  const response = await apiClient.get<{ data: BranchComparison }>(
    "/analytics/branches/comparison"
  );
  return response.data;
}

/**
 * Fetch branch performance
 */
async function fetchBranchPerformance(id: string): Promise<BranchPerformance> {
  const response = await apiClient.get<{ data: BranchPerformance }>(
    `/analytics/branches/${id}/performance`
  );
  return response.data;
}

/**
 * Fetch org stats
 */
async function fetchOrgStats(): Promise<OrgStats> {
  const response = await apiClient.get<{ data: OrgStats }>(
    "/analytics/organization"
  );
  return response.data;
}

// Hooks

export function useBranchComparison() {
  return useQuery({
    queryKey: analyticsKeys.branchComparison(),
    queryFn: fetchBranchComparison,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBranchPerformance(id: string) {
  return useQuery({
    queryKey: analyticsKeys.branchPerformance(id),
    queryFn: () => fetchBranchPerformance(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrgStats() {
  return useQuery({
    queryKey: analyticsKeys.orgStats(),
    queryFn: fetchOrgStats,
    staleTime: 5 * 60 * 1000,
  });
}
