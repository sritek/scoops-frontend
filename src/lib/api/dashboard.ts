import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { EnhancedDashboardData } from "@/types/dashboard";

/**
 * Query key for dashboard data
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
};

/**
 * Fetch dashboard from API
 * Returns role-specific dashboard with attendance, fees, action items, trends, and more
 */
async function fetchDashboard(): Promise<EnhancedDashboardData> {
  const response = await apiClient.get<{ data: EnhancedDashboardData }>("/dashboard");
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
 * Returns role-specific data:
 * - Admin/Staff: Full dashboard (attendance, fees, trends, action items, birthdays, staff attendance)
 * - Teacher: Own batch attendance + fees + birthdays
 * - Accounts: Fees only + collection trends
 *
 * @example
 * const { data, isLoading, error } = useDashboard();
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    // Refetch every 2 minutes
    staleTime: 2 * 60 * 1000,
    // Keep data fresh
    refetchOnWindowFocus: true,
  });
}
