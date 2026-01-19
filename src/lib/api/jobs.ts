import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";

/**
 * Jobs API endpoints and hooks
 */

// Query keys
export const jobsKeys = {
  all: ["jobs"] as const,
  definitions: () => [...jobsKeys.all, "definitions"] as const,
  runs: (filters?: JobRunFilters) => [...jobsKeys.all, "runs", filters] as const,
  run: (id: string) => [...jobsKeys.all, "run", id] as const,
  stats: (filters?: { jobName?: string; days?: number }) =>
    [...jobsKeys.all, "stats", filters] as const,
};

// API Types
export type JobStatus = "running" | "completed" | "failed" | "skipped";

export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  schedule: string;
  cronExpression?: string | null;
  intervalMinutes?: number | null;
  lastRunAt: string | null;
  lastStatus: JobStatus | null;
  lastDurationMs: number | null;
  isRunning: boolean;
}

export interface JobRun {
  id: string;
  jobName: string;
  status: JobStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  eventsEmitted: number;
  recordsProcessed: number;
  errorMessage: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface JobRunFilters {
  page?: number;
  limit?: number;
  jobName?: string;
  status?: JobStatus;
  startDate?: string;
  endDate?: string;
}

export interface JobStats {
  overall: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    running: number;
    successRate: number;
    avgDurationMs: number;
  };
  byJob: Array<{
    jobName: string;
    jobDisplayName: string;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    running: number;
    successRate: number;
    avgDurationMs: number;
  }>;
  periodDays: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch all job definitions with last run info
 */
export function useJobs() {
  return useQuery({
    queryKey: jobsKeys.definitions(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: JobDefinition[] }>("/jobs");
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30s
  });
}

/**
 * Fetch paginated job runs
 */
export function useJobRuns(filters: JobRunFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.jobName) params.set("jobName", filters.jobName);
  if (filters.status) params.set("status", filters.status);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const queryString = params.toString();

  return useQuery({
    queryKey: jobsKeys.runs(filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<JobRun>>(
        `/jobs/runs${queryString ? `?${queryString}` : ""}`
      );
      return response;
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Auto-refresh every 10s
  });
}

/**
 * Fetch a single job run by ID
 */
export function useJobRun(id: string) {
  return useQuery({
    queryKey: jobsKeys.run(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: JobRun }>(`/jobs/runs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch job statistics
 */
export function useJobStats(filters?: { jobName?: string; days?: number }) {
  const params = new URLSearchParams();
  if (filters?.jobName) params.set("jobName", filters.jobName);
  if (filters?.days) params.set("days", String(filters.days));

  const queryString = params.toString();

  return useQuery({
    queryKey: jobsKeys.stats(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ data: JobStats }>(
        `/jobs/stats${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Trigger a job manually
 */
export function useTriggerJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobName: string) => {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/jobs/${jobName}/trigger`
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate jobs and runs to show updated status
      queryClient.invalidateQueries({ queryKey: jobsKeys.definitions() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.runs() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
}

/**
 * Retry a failed job run
 */
export function useRetryJobRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/jobs/runs/${runId}/retry`
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate jobs and runs to show updated status
      queryClient.invalidateQueries({ queryKey: jobsKeys.definitions() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.runs() });
      queryClient.invalidateQueries({ queryKey: jobsKeys.stats() });
    },
  });
}
