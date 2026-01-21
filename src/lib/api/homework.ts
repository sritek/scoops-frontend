/**
 * Homework API
 *
 * API functions for managing homework (staff)
 */

import { apiClient } from "./client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================================================
// Types
// ============================================================================

export type HomeworkStatus = "draft" | "published" | "closed";
export type SubmissionStatus = "pending" | "submitted" | "late" | "graded";

export interface HomeworkAttachment {
  name: string;
  url: string;
}

export interface HomeworkListItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number | null;
  status: HomeworkStatus;
  batchId: string;
  batchName: string;
  subjectId: string | null;
  subjectName: string | null;
  createdBy: string;
  submissionCount: number;
  isOverdue: boolean;
  createdAt: string;
}

export interface HomeworkListResponse {
  data: HomeworkListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HomeworkDetail {
  id: string;
  title: string;
  description: string;
  attachments: HomeworkAttachment[] | null;
  dueDate: string;
  totalMarks: number | null;
  status: HomeworkStatus;
  batchId: string;
  batchName: string;
  subjectId: string | null;
  subjectName: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  attachments: HomeworkAttachment[] | null;
  marks: number | null;
  feedback: string | null;
  gradedBy: string | null;
  gradedAt: string | null;
}

export interface HomeworkSubmissionsResponse {
  homework: {
    id: string;
    title: string;
    totalMarks: number | null;
    status: HomeworkStatus;
  };
  submissions: HomeworkSubmission[];
  summary: {
    total: number;
    pending: number;
    submitted: number;
    graded: number;
  };
}

export interface HomeworkStats {
  totalActive: number;
  dueSoon: number;
  pendingGrading: number;
}

export interface CreateHomeworkInput {
  batchId: string;
  subjectId?: string | null;
  title: string;
  description: string;
  attachments?: HomeworkAttachment[];
  dueDate: string;
  totalMarks?: number | null;
}

export interface UpdateHomeworkInput {
  batchId?: string;
  subjectId?: string | null;
  title?: string;
  description?: string;
  attachments?: HomeworkAttachment[];
  dueDate?: string;
  totalMarks?: number | null;
}

export interface GradeSubmissionInput {
  marks: number;
  feedback?: string;
}

export interface HomeworkFilters {
  batchId?: string;
  subjectId?: string;
  status?: HomeworkStatus;
  page?: number;
  limit?: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get homework list
 */
export async function getHomeworkList(
  filters?: HomeworkFilters
): Promise<HomeworkListResponse> {
  const params = new URLSearchParams();
  if (filters?.batchId) params.set("batchId", filters.batchId);
  if (filters?.subjectId) params.set("subjectId", filters.subjectId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", filters.page.toString());
  if (filters?.limit) params.set("limit", filters.limit.toString());

  const query = params.toString();
  return apiClient.get(`/homework${query ? `?${query}` : ""}`);
}

/**
 * Get homework stats
 */
export async function getHomeworkStats(): Promise<HomeworkStats> {
  return apiClient.get("/homework/stats");
}

/**
 * Get homework detail
 */
export async function getHomeworkDetail(id: string): Promise<HomeworkDetail> {
  return apiClient.get(`/homework/${id}`);
}

/**
 * Create homework
 */
export async function createHomework(
  input: CreateHomeworkInput
): Promise<{ id: string }> {
  return apiClient.post("/homework", input);
}

/**
 * Update homework
 */
export async function updateHomework(
  id: string,
  input: UpdateHomeworkInput
): Promise<{ id: string }> {
  return apiClient.put(`/homework/${id}`, input);
}

/**
 * Delete homework
 */
export async function deleteHomework(id: string): Promise<{ success: boolean }> {
  return apiClient.delete(`/homework/${id}`);
}

/**
 * Publish homework
 */
export async function publishHomework(
  id: string
): Promise<{ success: boolean; studentCount: number }> {
  return apiClient.put(`/homework/${id}/publish`, {});
}

/**
 * Close homework
 */
export async function closeHomework(id: string): Promise<{ success: boolean }> {
  return apiClient.put(`/homework/${id}/close`, {});
}

/**
 * Get submissions for homework
 */
export async function getHomeworkSubmissions(
  id: string
): Promise<HomeworkSubmissionsResponse> {
  return apiClient.get(`/homework/${id}/submissions`);
}

/**
 * Grade a submission
 */
export async function gradeSubmission(
  submissionId: string,
  input: GradeSubmissionInput
): Promise<{ id: string; marks: number }> {
  return apiClient.put(`/homework/submissions/${submissionId}/grade`, input);
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch homework list
 */
export function useHomeworkList(filters?: HomeworkFilters) {
  return useQuery({
    queryKey: ["homework", "list", filters],
    queryFn: () => getHomeworkList(filters),
  });
}

/**
 * Hook to fetch homework stats
 */
export function useHomeworkStats() {
  return useQuery({
    queryKey: ["homework", "stats"],
    queryFn: getHomeworkStats,
  });
}

/**
 * Hook to fetch homework detail
 */
export function useHomeworkDetail(id: string) {
  return useQuery({
    queryKey: ["homework", id],
    queryFn: () => getHomeworkDetail(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch homework submissions
 */
export function useHomeworkSubmissions(id: string) {
  return useQuery({
    queryKey: ["homework", id, "submissions"],
    queryFn: () => getHomeworkSubmissions(id),
    enabled: !!id,
  });
}

/**
 * Hook to create homework
 */
export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

/**
 * Hook to update homework
 */
export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHomeworkInput }) =>
      updateHomework(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

/**
 * Hook to delete homework
 */
export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

/**
 * Hook to publish homework
 */
export function usePublishHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

/**
 * Hook to close homework
 */
export function useCloseHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

/**
 * Hook to grade submission
 */
export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      input,
    }: {
      submissionId: string;
      input: GradeSubmissionInput;
    }) => gradeSubmission(submissionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}
