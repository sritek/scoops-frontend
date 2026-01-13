import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  FeePlan,
  StudentFee,
  StudentFeesResponse,
  CreateFeePlanInput,
  AssignFeeInput,
  RecordPaymentInput,
  FeeStatus,
} from "@/types/fee";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for pending fees list with filters
 */
export interface PendingFeesParams extends PaginationParams {
  status?: FeeStatus;
  studentId?: string;
}

/**
 * Extended params for fee plans list with filters
 */
export interface FeePlansParams extends PaginationParams {
  isActive?: boolean;
}

/**
 * Query keys for fees
 */
export const feesKeys = {
  all: ["fees"] as const,
  plans: (params?: FeePlansParams) =>
    [...feesKeys.all, "plans", params] as const,
  pending: (params?: PendingFeesParams) =>
    [...feesKeys.all, "pending", params] as const,
  studentFees: (studentId: string) =>
    [...feesKeys.all, "student", studentId] as const,
};

/**
 * Fetch fee plans with pagination
 */
async function fetchFeePlans(
  params: FeePlansParams = {}
): Promise<PaginatedResponse<FeePlan>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/fees/plans?${queryString}` : "/fees/plans";

  return apiClient.get<PaginatedResponse<FeePlan>>(endpoint);
}

/**
 * Fetch pending fees with pagination and filters
 */
async function fetchPendingFees(
  params: PendingFeesParams = {}
): Promise<PaginatedResponse<StudentFee>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.studentId) searchParams.set("studentId", params.studentId);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/fees/pending?${queryString}` : "/fees/pending";

  return apiClient.get<PaginatedResponse<StudentFee>>(endpoint);
}

/**
 * Fetch fees for a specific student
 */
async function fetchStudentFees(studentId: string): Promise<StudentFeesResponse> {
  const response = await apiClient.get<{ data: StudentFeesResponse }>(
    `/fees/students/${studentId}`
  );
  return response.data;
}

/**
 * Create a new fee plan
 */
async function createFeePlan(data: CreateFeePlanInput): Promise<FeePlan> {
  const response = await apiClient.post<{ data: FeePlan }>("/fees/plans", data);
  return response.data;
}

/**
 * Assign a fee to a student
 */
async function assignFee(data: AssignFeeInput): Promise<StudentFee> {
  const response = await apiClient.post<{ data: StudentFee }>("/fees/assign", data);
  return response.data;
}

/**
 * Record a payment
 */
async function recordPayment(data: RecordPaymentInput): Promise<{ payment: unknown; fee: StudentFee }> {
  const response = await apiClient.post<{ data: { payment: unknown; fee: StudentFee } }>(
    "/fees/payments",
    data
  );
  return response.data;
}

/**
 * Hook to fetch fee plans
 */
export function useFeePlans(params: FeePlansParams = {}) {
  return useQuery({
    queryKey: feesKeys.plans(params),
    queryFn: () => fetchFeePlans(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch pending fees
 */
export function usePendingFees(params: PendingFeesParams = {}) {
  return useQuery({
    queryKey: feesKeys.pending(params),
    queryFn: () => fetchPendingFees(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch fees for a specific student
 */
export function useStudentFees(studentId: string | null) {
  return useQuery({
    queryKey: feesKeys.studentFees(studentId || ""),
    queryFn: () => fetchStudentFees(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create a fee plan
 */
export function useCreateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feesKeys.all });
    },
  });
}

/**
 * Hook to assign a fee to a student
 */
export function useAssignFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignFee,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: feesKeys.pending() });
      queryClient.invalidateQueries({
        queryKey: feesKeys.studentFees(variables.studentId),
      });
    },
  });
}

/**
 * Hook to record a payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      // Invalidate all fee queries since payment affects multiple views
      queryClient.invalidateQueries({ queryKey: feesKeys.all });
    },
  });
}
