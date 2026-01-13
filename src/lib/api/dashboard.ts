import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { DashboardData } from "@/types/dashboard";

/**
 * Query key for dashboard data
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};

/**
 * Fetch dashboard summary from API
 */
async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<{ data: DashboardData }>("/dashboard");
  return response.data;
}

/**
 * Hook to fetch dashboard data
 *
 * Uses TanStack Query for:
 * - Automatic caching
 * - Background refetching
 * - Loading/error states
 *
 * @example
 * const { data, isLoading, error } = useDashboard();
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: fetchDashboard,
    // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep data fresh
    refetchOnWindowFocus: true,
  });
}
