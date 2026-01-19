/**
 * Reports API Client
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Report,
  RequestReportInput,
  ReportTypeInfo,
  ReportFilters,
} from "@/types/report";
import type { PaginatedResponse } from "@/types";
import { config } from "@/config";

// Query keys
export const reportsKeys = {
  all: ["reports"] as const,
  lists: () => [...reportsKeys.all, "list"] as const,
  list: (filters: ReportFilters) => [...reportsKeys.lists(), filters] as const,
  details: () => [...reportsKeys.all, "detail"] as const,
  detail: (id: string) => [...reportsKeys.details(), id] as const,
  types: () => [...reportsKeys.all, "types"] as const,
};

/**
 * Fetch report types
 */
export async function fetchReportTypes(): Promise<ReportTypeInfo[]> {
  const response = await apiClient.get<{ data: ReportTypeInfo[] }>("/reports/types");
  return response.data;
}

/**
 * Fetch reports
 */
export async function fetchReports(
  filters: ReportFilters = {}
): Promise<PaginatedResponse<Report>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.type) params.append("type", filters.type);
  if (filters.status) params.append("status", filters.status);

  return apiClient.get(`/reports?${params.toString()}`);
}

/**
 * Fetch single report
 */
export async function fetchReport(id: string): Promise<Report> {
  const response = await apiClient.get<{ data: Report }>(`/reports/${id}`);
  return response.data;
}

/**
 * Request a new report
 */
export async function requestReport(input: RequestReportInput): Promise<Report> {
  const response = await apiClient.post<{ data: Report }>("/reports", input);
  return response.data;
}

/**
 * Delete a report
 */
export async function deleteReport(id: string): Promise<void> {
  await apiClient.delete(`/reports/${id}`);
}

/**
 * Download report
 */
export function getReportDownloadUrl(id: string): string {
  const token = typeof window !== "undefined" 
    ? localStorage.getItem("scoops_token") 
    : null;
  return `${config.api.baseUrl}/reports/${id}/download?token=${token || ""}`;
}

// React Query Hooks

/**
 * Hook to fetch report types
 */
export function useReportTypes() {
  return useQuery({
    queryKey: reportsKeys.types(),
    queryFn: fetchReportTypes,
  });
}

/**
 * Hook to fetch reports
 */
export function useReports(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.list(filters),
    queryFn: () => fetchReports(filters),
    refetchInterval: 5000, // Refresh every 5s to check for completed reports
  });
}

/**
 * Hook to fetch single report
 */
export function useReport(id: string) {
  return useQuery({
    queryKey: reportsKeys.detail(id),
    queryFn: () => fetchReport(id),
    enabled: !!id,
  });
}

/**
 * Hook to request a report
 */
export function useRequestReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
    },
  });
}

/**
 * Hook to delete a report
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.lists() });
    },
  });
}
