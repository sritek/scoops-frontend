/**
 * Exams API Client
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getStoredToken } from "./client";
import { config } from "@/config";
import type {
  Exam,
  ExamDetail,
  CreateExamInput,
  ExamFilters,
  StudentForMarks,
  SaveScoresInput,
  ReportCard,
} from "@/types/exam";
import type { PaginatedResponse } from "@/types";

// Query keys
export const examsKeys = {
  all: ["exams"] as const,
  lists: () => [...examsKeys.all, "list"] as const,
  list: (filters: ExamFilters) => [...examsKeys.lists(), filters] as const,
  details: () => [...examsKeys.all, "detail"] as const,
  detail: (id: string) => [...examsKeys.details(), id] as const,
  students: (examId: string) => [...examsKeys.all, "students", examId] as const,
  reportCards: () => [...examsKeys.all, "reportCard"] as const,
  reportCard: (studentId: string) => [...examsKeys.reportCards(), studentId] as const,
};

export async function fetchExams(filters: ExamFilters = {}): Promise<PaginatedResponse<Exam>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.batchId) params.append("batchId", filters.batchId);
  if (filters.type) params.append("type", filters.type);
  if (typeof filters.isPublished === "boolean") {
    params.append("isPublished", filters.isPublished.toString());
  }

  return apiClient.get(`/exams?${params.toString()}`);
}

export async function fetchExam(id: string): Promise<ExamDetail> {
  const response = await apiClient.get<{ data: ExamDetail }>(`/exams/${id}`);
  return response.data;
}

export async function fetchStudentsForMarks(examId: string): Promise<StudentForMarks[]> {
  const response = await apiClient.get<{ data: StudentForMarks[] }>(`/exams/${examId}/students`);
  return response.data;
}

export async function createExam(input: CreateExamInput): Promise<Exam> {
  const response = await apiClient.post<{ data: Exam }>("/exams", input);
  return response.data;
}

export async function updateExam(id: string, input: Partial<CreateExamInput & { isPublished: boolean }>): Promise<Exam> {
  const response = await apiClient.put<{ data: Exam }>(`/exams/${id}`, input);
  return response.data;
}

export async function deleteExam(id: string): Promise<void> {
  await apiClient.delete(`/exams/${id}`);
}

export async function saveScores(examId: string, input: SaveScoresInput): Promise<void> {
  await apiClient.post(`/exams/${examId}/scores`, input);
}

/**
 * Fetch student report card
 */
export async function fetchStudentReportCard(studentId: string): Promise<ReportCard> {
  const response = await apiClient.get<{ data: ReportCard }>(`/exams/report-card/${studentId}`);
  return response.data;
}

/**
 * Download report card as PDF
 */
export async function downloadReportCardPDF(studentId: string): Promise<Blob> {
  const token = getStoredToken();
  const response = await fetch(
    `${config.api.baseUrl}/exams/report-card/${studentId}/pdf`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download report card");
  }

  return response.blob();
}

// Hooks
export function useExams(filters: ExamFilters = {}) {
  return useQuery({
    queryKey: examsKeys.list(filters),
    queryFn: () => fetchExams(filters),
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: examsKeys.detail(id),
    queryFn: () => fetchExam(id),
    enabled: !!id,
  });
}

export function useStudentsForMarks(examId: string) {
  return useQuery({
    queryKey: examsKeys.students(examId),
    queryFn: () => fetchStudentsForMarks(examId),
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examsKeys.lists() });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExamInput & { isPublished: boolean }> }) =>
      updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examsKeys.all });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examsKeys.lists() });
    },
  });
}

export function useSaveScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, input }: { examId: string; input: SaveScoresInput }) =>
      saveScores(examId, input),
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: examsKeys.detail(examId) });
      queryClient.invalidateQueries({ queryKey: examsKeys.students(examId) });
    },
  });
}

/**
 * Hook to fetch student report card
 */
export function useStudentReportCard(studentId: string) {
  return useQuery({
    queryKey: examsKeys.reportCard(studentId),
    queryFn: () => fetchStudentReportCard(studentId),
    enabled: !!studentId,
  });
}
