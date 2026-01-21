/**
 * Leave Application API
 *
 * Types and functions for leave application management
 */

import { apiClient } from "./client";
import { parentApiClient } from "./parent";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// Types
// ============================================================================

export type StudentLeaveType =
  | "sick"
  | "family"
  | "vacation"
  | "medical"
  | "other";
export type StudentLeaveStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface LeaveApplication {
  id: string;
  type: StudentLeaveType;
  reason: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: StudentLeaveStatus;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface LeaveApplicationWithStudent extends LeaveApplication {
  student: {
    id: string;
    name: string;
    batchId: string | null;
    batchName: string | null;
  };
  parent: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface SubmitLeaveInput {
  type: StudentLeaveType;
  reason: string;
  startDate: string;
  endDate: string;
}

export interface ReviewLeaveInput {
  status: "approved" | "rejected";
  reviewNote?: string;
}

export interface LeaveStats {
  pending: number;
  approvedThisMonth: number;
  totalThisMonth: number;
}

export interface LeaveFilters {
  status?: StudentLeaveStatus;
  batchId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Leave Type Labels
// ============================================================================

export const LEAVE_TYPE_LABELS: Record<StudentLeaveType, string> = {
  sick: "Sick Leave",
  family: "Family Emergency",
  vacation: "Vacation",
  medical: "Medical Appointment",
  other: "Other",
};

export const LEAVE_STATUS_LABELS: Record<StudentLeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// ============================================================================
// Staff API Functions
// ============================================================================

/**
 * Get all leave applications (staff)
 */
export async function getLeaveApplications(
  filters: LeaveFilters = {}
): Promise<PaginatedResponse<LeaveApplicationWithStudent>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.batchId) params.set("batchId", filters.batchId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const query = params.toString();
  return apiClient.get(`/leave-applications${query ? `?${query}` : ""}`);
}

/**
 * Get leave application by ID (staff)
 */
export async function getLeaveApplication(
  id: string
): Promise<LeaveApplicationWithStudent> {
  return apiClient.get(`/leave-applications/${id}`);
}

/**
 * Review (approve/reject) leave application (staff)
 */
export async function reviewLeaveApplication(
  id: string,
  input: ReviewLeaveInput
): Promise<{
  id: string;
  status: StudentLeaveStatus;
  reviewedAt: string | null;
  reviewNote: string | null;
}> {
  return apiClient.patch(`/leave-applications/${id}`, input);
}

/**
 * Get leave statistics (staff)
 */
export async function getLeaveStats(): Promise<LeaveStats> {
  return apiClient.get("/leave-applications/stats");
}

// ============================================================================
// Parent API Functions
// ============================================================================

/**
 * Submit leave application (parent)
 */
export async function submitLeaveApplication(
  studentId: string,
  input: SubmitLeaveInput
): Promise<
  LeaveApplication & { studentName: string; batchName: string | null }
> {
  return parentApiClient.post(`/parent/children/${studentId}/leave`, input);
}

/**
 * Get child's leave applications (parent)
 */
export async function getChildLeaveApplications(
  studentId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<LeaveApplication>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return parentApiClient.get(
    `/parent/children/${studentId}/leave${query ? `?${query}` : ""}`
  );
}

/**
 * Cancel pending leave application (parent)
 */
export async function cancelLeaveApplication(
  leaveId: string
): Promise<{ success: boolean; message: string }> {
  return parentApiClient.delete(`/parent/leave/${leaveId}`);
}

// ============================================================================
// React Query Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to get leave applications (staff)
 */
export function useLeaveApplications(filters: LeaveFilters = {}) {
  return useQuery({
    queryKey: ["leave-applications", filters],
    queryFn: () => getLeaveApplications(filters),
  });
}

/**
 * Hook to get leave stats (staff)
 */
export function useLeaveStats() {
  return useQuery({
    queryKey: ["leave-stats"],
    queryFn: getLeaveStats,
  });
}

/**
 * Hook to review leave application (staff)
 */
export function useReviewLeaveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReviewLeaveInput }) =>
      reviewLeaveApplication(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-stats"] });
    },
  });
}

/**
 * Hook to submit leave application (parent)
 */
export function useSubmitLeaveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      input,
    }: {
      studentId: string;
      input: SubmitLeaveInput;
    }) => submitLeaveApplication(studentId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["parent", "children", variables.studentId, "leave"],
      });
    },
  });
}

/**
 * Hook to get child's leave applications (parent)
 */
export function useChildLeaveApplications(
  studentId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["parent", "children", studentId, "leave", params],
    queryFn: () => getChildLeaveApplications(studentId, params),
    enabled: !!studentId,
  });
}

/**
 * Hook to cancel leave application (parent)
 */
export function useCancelLeaveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaveId: string) => cancelLeaveApplication(leaveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent", "children"] });
    },
  });
}
