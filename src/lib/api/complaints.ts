/**
 * Complaints API Client
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Complaint,
  ComplaintDetail,
  CreateComplaintInput,
  UpdateComplaintInput,
  AddCommentInput,
  ComplaintFilters,
  ComplaintStats,
  ComplaintComment,
} from "@/types/complaint";
import type { PaginatedResponse } from "@/types";

// Query keys
export const complaintsKeys = {
  all: ["complaints"] as const,
  stats: () => [...complaintsKeys.all, "stats"] as const,
  lists: () => [...complaintsKeys.all, "list"] as const,
  list: (filters: ComplaintFilters) => [...complaintsKeys.lists(), filters] as const,
  details: () => [...complaintsKeys.all, "detail"] as const,
  detail: (id: string) => [...complaintsKeys.details(), id] as const,
};

/**
 * Fetch complaint stats
 */
async function fetchComplaintStats(): Promise<ComplaintStats> {
  const response = await apiClient.get<{ data: ComplaintStats }>("/complaints/stats");
  return response.data;
}

/**
 * Fetch complaints
 */
async function fetchComplaints(
  filters: ComplaintFilters = {}
): Promise<PaginatedResponse<Complaint>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.category) params.append("category", filters.category);
  if (filters.assignedToId) params.append("assignedToId", filters.assignedToId);

  return apiClient.get(`/complaints?${params.toString()}`);
}

/**
 * Fetch complaint detail
 */
async function fetchComplaint(id: string): Promise<ComplaintDetail> {
  const response = await apiClient.get<{ data: ComplaintDetail }>(
    `/complaints/${id}`
  );
  return response.data;
}

/**
 * Create complaint
 */
async function createComplaint(
  input: CreateComplaintInput
): Promise<Complaint> {
  const response = await apiClient.post<{ data: Complaint }>(
    "/complaints",
    input
  );
  return response.data;
}

/**
 * Update complaint
 */
async function updateComplaint(
  id: string,
  input: UpdateComplaintInput
): Promise<Complaint> {
  const response = await apiClient.put<{ data: Complaint }>(
    `/complaints/${id}`,
    input
  );
  return response.data;
}

/**
 * Add comment
 */
async function addComment(
  complaintId: string,
  input: AddCommentInput
): Promise<ComplaintComment> {
  const response = await apiClient.post<{ data: ComplaintComment }>(
    `/complaints/${complaintId}/comments`,
    input
  );
  return response.data;
}

// Hooks

export function useComplaintStats() {
  return useQuery({
    queryKey: complaintsKeys.stats(),
    queryFn: fetchComplaintStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useComplaints(filters: ComplaintFilters = {}) {
  return useQuery({
    queryKey: complaintsKeys.list(filters),
    queryFn: () => fetchComplaints(filters),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: complaintsKeys.detail(id),
    queryFn: () => fetchComplaint(id),
    enabled: !!id,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintsKeys.all });
    },
  });
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateComplaintInput }) =>
      updateComplaint(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintsKeys.all });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      complaintId,
      input,
    }: {
      complaintId: string;
      input: AddCommentInput;
    }) => addComment(complaintId, input),
    onSuccess: (_, { complaintId }) => {
      queryClient.invalidateQueries({
        queryKey: complaintsKeys.detail(complaintId),
      });
    },
  });
}
