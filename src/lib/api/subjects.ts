import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Subject, CreateSubjectInput, UpdateSubjectInput } from "@/types/subject";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Query keys for subjects
 */
export const subjectsKeys = {
  all: ["subjects"] as const,
  list: (params?: PaginationParams) =>
    [...subjectsKeys.all, "list", params] as const,
  allActive: () => [...subjectsKeys.all, "allActive"] as const,
  detail: (id: string) => [...subjectsKeys.all, "detail", id] as const,
};

/**
 * Fetch subjects with pagination
 */
async function fetchSubjects(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Subject>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/subjects?${queryString}` : "/subjects";

  return apiClient.get<PaginatedResponse<Subject>>(endpoint);
}

/**
 * Fetch all active subjects (for dropdowns)
 */
async function fetchAllSubjects(): Promise<Subject[]> {
  const response = await apiClient.get<{ data: Subject[] }>("/subjects/all");
  return response.data;
}

/**
 * Create a new subject
 */
async function createSubject(data: CreateSubjectInput): Promise<Subject> {
  const response = await apiClient.post<{ data: Subject }>("/subjects", data);
  return response.data;
}

/**
 * Update an existing subject
 */
async function updateSubject({
  id,
  data,
}: {
  id: string;
  data: UpdateSubjectInput;
}): Promise<Subject> {
  const response = await apiClient.put<{ data: Subject }>(`/subjects/${id}`, data);
  return response.data;
}

/**
 * Delete a subject
 */
async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/subjects/${id}`);
}

/**
 * Hook to fetch subjects list
 */
export function useSubjects(params: PaginationParams = {}) {
  return useQuery({
    queryKey: subjectsKeys.list(params),
    queryFn: () => fetchSubjects(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all active subjects (for dropdowns)
 */
export function useAllSubjects() {
  return useQuery({
    queryKey: subjectsKeys.allActive(),
    queryFn: fetchAllSubjects,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new subject
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

/**
 * Hook to update a subject
 */
export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

/**
 * Hook to delete a subject
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}
