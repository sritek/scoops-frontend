import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Scholarship,
  StudentScholarship,
  CreateScholarshipInput,
  UpdateScholarshipInput,
  AssignScholarshipInput,
} from "@/types/scholarship";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for scholarships list with filters
 */
export interface ScholarshipsParams extends PaginationParams {
  isActive?: boolean;
  type?: "percentage" | "fixed_amount" | "component_waiver";
  basis?: string;
}

/**
 * Query keys for scholarships
 */
export const scholarshipsKeys = {
  all: ["scholarships"] as const,
  list: (params?: ScholarshipsParams) => [...scholarshipsKeys.all, "list", params] as const,
  allActive: () => [...scholarshipsKeys.all, "all"] as const,
  detail: (id: string) => [...scholarshipsKeys.all, "detail", id] as const,
  student: (studentId: string, sessionId?: string) =>
    [...scholarshipsKeys.all, "student", studentId, sessionId] as const,
};

/**
 * Fetch scholarships with pagination
 */
async function fetchScholarships(
  params: ScholarshipsParams = {}
): Promise<PaginatedResponse<Scholarship>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
  if (params.type) searchParams.set("type", params.type);
  if (params.basis) searchParams.set("basis", params.basis);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/scholarships?${queryString}` : "/scholarships";

  return apiClient.get<PaginatedResponse<Scholarship>>(endpoint);
}

/**
 * Fetch all active scholarships (for dropdowns)
 */
async function fetchAllScholarships(): Promise<Scholarship[]> {
  const response = await apiClient.get<{ data: Scholarship[] }>("/scholarships/all");
  return response.data;
}

/**
 * Fetch a single scholarship
 */
async function fetchScholarship(id: string): Promise<Scholarship> {
  const response = await apiClient.get<{ data: Scholarship }>(`/scholarships/${id}`);
  return response.data;
}

/**
 * Create a scholarship
 */
async function createScholarship(data: CreateScholarshipInput): Promise<Scholarship> {
  const response = await apiClient.post<{ data: Scholarship }>("/scholarships", data);
  return response.data;
}

/**
 * Update a scholarship
 */
async function updateScholarship({
  id,
  data,
}: {
  id: string;
  data: UpdateScholarshipInput;
}): Promise<Scholarship> {
  const response = await apiClient.patch<{ data: Scholarship }>(`/scholarships/${id}`, data);
  return response.data;
}

/**
 * Delete (deactivate) a scholarship
 */
async function deleteScholarship(id: string): Promise<void> {
  await apiClient.delete(`/scholarships/${id}`);
}

/**
 * Assign scholarship to student
 */
async function assignScholarship(data: AssignScholarshipInput): Promise<StudentScholarship> {
  const response = await apiClient.post<{ data: StudentScholarship }>("/scholarships/assign", data);
  return response.data;
}

/**
 * Remove scholarship from student
 */
async function removeStudentScholarship(id: string): Promise<void> {
  await apiClient.delete(`/scholarships/student/${id}`);
}

/**
 * Fetch scholarships for a student
 */
async function fetchStudentScholarships(
  studentId: string,
  sessionId?: string
): Promise<StudentScholarship[]> {
  const searchParams = new URLSearchParams();
  if (sessionId) searchParams.set("sessionId", sessionId);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/scholarships/student/${studentId}?${queryString}`
    : `/scholarships/student/${studentId}`;

  const response = await apiClient.get<{ data: StudentScholarship[] }>(endpoint);
  return response.data;
}

// =====================
// Hooks
// =====================

/**
 * Hook to fetch scholarships
 */
export function useScholarships(params: ScholarshipsParams = {}) {
  return useQuery({
    queryKey: scholarshipsKeys.list(params),
    queryFn: () => fetchScholarships(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all active scholarships (for dropdowns)
 */
export function useAllScholarships() {
  return useQuery({
    queryKey: scholarshipsKeys.allActive(),
    queryFn: fetchAllScholarships,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single scholarship
 */
export function useScholarship(id: string | null) {
  return useQuery({
    queryKey: scholarshipsKeys.detail(id || ""),
    queryFn: () => fetchScholarship(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a scholarship
 */
export function useCreateScholarship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScholarship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipsKeys.all });
    },
  });
}

/**
 * Hook to update a scholarship
 */
export function useUpdateScholarship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateScholarship,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: scholarshipsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: scholarshipsKeys.list() });
    },
  });
}

/**
 * Hook to delete a scholarship
 */
export function useDeleteScholarship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScholarship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipsKeys.all });
    },
  });
}

/**
 * Hook to fetch student scholarships
 */
export function useStudentScholarships(studentId: string | null, sessionId?: string) {
  return useQuery({
    queryKey: scholarshipsKeys.student(studentId || "", sessionId),
    queryFn: () => fetchStudentScholarships(studentId!, sessionId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to assign scholarship to student
 */
export function useAssignScholarship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignScholarship,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: scholarshipsKeys.student(variables.studentId),
      });
      // Also invalidate fee structure since scholarship affects it
      queryClient.invalidateQueries({ queryKey: ["fees", "student-structure"] });
    },
  });
}

/**
 * Hook to remove scholarship from student
 */
export function useRemoveStudentScholarship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStudentScholarship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scholarshipsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["fees", "student-structure"] });
    },
  });
}
