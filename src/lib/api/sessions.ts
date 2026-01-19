import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { AcademicSession, CreateSessionInput, UpdateSessionInput } from "@/types/session";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Query keys for sessions
 */
export const sessionsKeys = {
  all: ["sessions"] as const,
  list: (params?: PaginationParams) =>
    [...sessionsKeys.all, "list", params] as const,
  detail: (id: string) => [...sessionsKeys.all, "detail", id] as const,
  current: () => [...sessionsKeys.all, "current"] as const,
};

/**
 * Fetch sessions with pagination
 */
async function fetchSessions(
  params: PaginationParams = {}
): Promise<PaginatedResponse<AcademicSession>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/sessions?${queryString}` : "/sessions";

  return apiClient.get<PaginatedResponse<AcademicSession>>(endpoint);
}

/**
 * Fetch current session
 */
async function fetchCurrentSession(): Promise<AcademicSession> {
  const response = await apiClient.get<{ data: AcademicSession }>("/sessions/current");
  return response.data;
}

/**
 * Create a new session
 */
async function createSession(data: CreateSessionInput): Promise<AcademicSession> {
  const response = await apiClient.post<{ data: AcademicSession }>("/sessions", data);
  return response.data;
}

/**
 * Update an existing session
 */
async function updateSession({
  id,
  data,
}: {
  id: string;
  data: UpdateSessionInput;
}): Promise<AcademicSession> {
  const response = await apiClient.put<{ data: AcademicSession }>(`/sessions/${id}`, data);
  return response.data;
}

/**
 * Delete a session
 */
async function deleteSession(id: string): Promise<void> {
  await apiClient.delete(`/sessions/${id}`);
}

/**
 * Hook to fetch sessions list
 */
export function useSessions(params: PaginationParams = {}) {
  return useQuery({
    queryKey: sessionsKeys.list(params),
    queryFn: () => fetchSessions(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch current session
 */
export function useCurrentSession() {
  return useQuery({
    queryKey: sessionsKeys.current(),
    queryFn: fetchCurrentSession,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new session
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}

/**
 * Hook to update a session
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}

/**
 * Hook to delete a session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}
