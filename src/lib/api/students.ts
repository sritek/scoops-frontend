import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Student,
  CreateStudentInput,
  UpdateStudentInput,
} from "@/types/student";
import type { PaginatedResponse, PaginationParams } from "@/types";
import { healthKeys } from "./health";

/**
 * Extended params for students list with filters
 */
export interface StudentListParams extends PaginationParams {
  search?: string;
  batchId?: string;
  status?: "active" | "inactive";
  gender?: "male" | "female" | "other";
  category?: "gen" | "sc" | "st" | "obc" | "minority";
}

/**
 * Query keys for students
 */
export const studentsKeys = {
  all: ["students"] as const,
  list: (params?: StudentListParams) =>
    [...studentsKeys.all, "list", params] as const,
  detail: (id: string) => [...studentsKeys.all, "detail", id] as const,
};

/**
 * Fetch students with pagination and filters
 */
async function fetchStudents(
  params: StudentListParams = {}
): Promise<PaginatedResponse<Student>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.batchId) searchParams.set("batchId", params.batchId);
  if (params.status) searchParams.set("status", params.status);
  if (params.gender) searchParams.set("gender", params.gender);
  if (params.category) searchParams.set("category", params.category);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/students?${queryString}` : "/students";

  return apiClient.get<PaginatedResponse<Student>>(endpoint);
}

/**
 * Fetch a single student by ID
 */
async function fetchStudent(id: string): Promise<Student> {
  const response = await apiClient.get<{ data: Student }>(`/students/${id}`);
  return response.data;
}

/**
 * Create a new student
 */
async function createStudent(data: CreateStudentInput): Promise<Student> {
  // Filter out empty batchId
  const payload = {
    ...data,
    batchId: data.batchId || undefined,
    // Filter out empty parent entries
    parents: data.parents?.filter((p) => p.firstName && p.lastName && p.phone),
  };

  // Remove undefined values
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );

  const response = await apiClient.post<{ data: Student }>(
    "/students",
    cleanPayload
  );
  return response.data;
}

/**
 * Update an existing student
 */
async function updateStudent({
  id,
  data,
}: {
  id: string;
  data: UpdateStudentInput;
}): Promise<Student> {
  const payload = {
    ...data,
    batchId: data.batchId || undefined,
    // Filter out empty parent entries
    parents: data.parents?.filter((p) => p.firstName && p.lastName && p.phone),
  };
  const response = await apiClient.put<{ data: Student }>(
    `/students/${id}`,
    payload
  );
  return response.data;
}

/**
 * Deactivate a student
 */
async function deleteStudent(id: string): Promise<Student> {
  const response = await apiClient.delete<{ data: Student }>(`/students/${id}`);
  return response.data;
}

/**
 * Hook to fetch students list with pagination and filters
 *
 * @example
 * const { data, isLoading, error } = useStudents({ page: 1, limit: 20, search: "john" });
 */
export function useStudents(params: StudentListParams = {}) {
  return useQuery({
    queryKey: studentsKeys.list(params),
    queryFn: () => fetchStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single student by ID
 *
 * @example
 * const { data: student, isLoading } = useStudent(id);
 */
export function useStudent(id: string | null) {
  return useQuery({
    queryKey: studentsKeys.detail(id || ""),
    queryFn: () => fetchStudent(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create a new student
 *
 * @example
 * const { mutate: createStudent, isPending } = useCreateStudent();
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (data) => {
      // Immediately cache the created student for instant detail page load
      queryClient.setQueryData(studentsKeys.detail(data.id), data);

      // Invalidate list queries so they refetch on next view
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });
    },
  });
}

/**
 * Hook to update an existing student
 *
 * @example
 * const { mutate: updateStudent, isPending } = useUpdateStudent();
 * updateStudent({ id: "...", data: { firstName: "John" } });
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: (data, variables) => {
      // Immediately update the cache with the response for instant UI update
      queryClient.setQueryData(studentsKeys.detail(variables.id), data);

      // Invalidate list queries so they refetch on next view
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });

      // If health data was updated, also invalidate health queries
      if (variables.data.health !== undefined) {
        queryClient.invalidateQueries({
          queryKey: healthKeys.student(variables.id),
        });
      }
    },
  });
}

/**
 * Hook to deactivate a student
 *
 * @example
 * const { mutate: deactivateStudent, isPending } = useDeleteStudent();
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentsKeys.all });
    },
  });
}
