import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  StudentHealthResponse,
  HealthCheckupsResponse,
  HealthCheckup,
  UpdateStudentHealthInput,
  CreateHealthCheckupInput,
} from "@/types/health";

/**
 * Query keys for health data
 */
export const healthKeys = {
  all: ["health"] as const,
  student: (studentId: string) => [...healthKeys.all, "student", studentId] as const,
  checkups: (studentId: string) => [...healthKeys.all, "checkups", studentId] as const,
  checkup: (studentId: string, checkupId: string) =>
    [...healthKeys.all, "checkup", studentId, checkupId] as const,
};

/**
 * Fetch student health data
 */
async function fetchStudentHealth(studentId: string): Promise<StudentHealthResponse> {
  const response = await apiClient.get<{ data: StudentHealthResponse }>(
    `/students/${studentId}/health`
  );
  return response.data;
}

/**
 * Update student health data
 */
async function updateStudentHealth({
  studentId,
  data,
}: {
  studentId: string;
  data: UpdateStudentHealthInput;
}): Promise<StudentHealthResponse> {
  const response = await apiClient.put<{ data: StudentHealthResponse }>(
    `/students/${studentId}/health`,
    data
  );
  return response.data;
}

/**
 * Fetch health checkup history
 */
async function fetchHealthCheckups(studentId: string): Promise<HealthCheckupsResponse> {
  const response = await apiClient.get<{ data: HealthCheckupsResponse }>(
    `/students/${studentId}/checkups`
  );
  return response.data;
}

/**
 * Create health checkup
 */
async function createHealthCheckup({
  studentId,
  data,
}: {
  studentId: string;
  data: CreateHealthCheckupInput;
}): Promise<HealthCheckup> {
  const response = await apiClient.post<{ data: HealthCheckup }>(
    `/students/${studentId}/checkups`,
    data
  );
  return response.data;
}

/**
 * Delete health checkup
 */
async function deleteHealthCheckup({
  studentId,
  checkupId,
}: {
  studentId: string;
  checkupId: string;
}): Promise<void> {
  await apiClient.delete(`/students/${studentId}/checkups/${checkupId}`);
}

// =====================
// Hooks
// =====================

/**
 * Hook to fetch student health data
 */
export function useStudentHealth(studentId: string | null) {
  return useQuery({
    queryKey: healthKeys.student(studentId || ""),
    queryFn: () => fetchStudentHealth(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to update student health data
 */
export function useUpdateStudentHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudentHealth,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: healthKeys.student(variables.studentId) });
    },
  });
}

/**
 * Hook to fetch health checkup history
 */
export function useHealthCheckups(studentId: string | null) {
  return useQuery({
    queryKey: healthKeys.checkups(studentId || ""),
    queryFn: () => fetchHealthCheckups(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create health checkup
 */
export function useCreateHealthCheckup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHealthCheckup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: healthKeys.checkups(variables.studentId) });
      queryClient.invalidateQueries({ queryKey: healthKeys.student(variables.studentId) });
    },
  });
}

/**
 * Hook to delete health checkup
 */
export function useDeleteHealthCheckup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHealthCheckup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: healthKeys.checkups(variables.studentId) });
    },
  });
}
