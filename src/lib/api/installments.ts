import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  FeeComponent,
  BatchFeeStructure,
  StudentFeeStructure,
  StudentFeeSummary,
  FeeInstallment,
  PendingInstallment,
  EMIPlanTemplate,
  CreateFeeComponentInput,
  UpdateFeeComponentInput,
  CreateBatchFeeStructureInput,
  CreateStudentFeeStructureInput,
  CreateEMIPlanTemplateInput,
  GenerateInstallmentsInput,
  RecordInstallmentPaymentInput,
  InstallmentStatus,
  EMIPlanTemplateApiResponse,
} from "@/types/fee";
import type { PaginatedResponse, PaginationParams } from "@/types";

// =====================
// Fee Components
// =====================

export interface FeeComponentsParams extends PaginationParams {
  isActive?: boolean;
  type?: string;
}

export const feeComponentsKeys = {
  all: ["fee-components"] as const,
  list: (params?: FeeComponentsParams) =>
    [...feeComponentsKeys.all, "list", params] as const,
  allActive: () => [...feeComponentsKeys.all, "all"] as const,
  detail: (id: string) => [...feeComponentsKeys.all, "detail", id] as const,
};

async function fetchFeeComponents(
  params: FeeComponentsParams = {},
): Promise<PaginatedResponse<FeeComponent>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params.type) searchParams.set("type", params.type);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/components?${queryString}`
    : "/fees/components";

  return apiClient.get<PaginatedResponse<FeeComponent>>(endpoint);
}

async function fetchAllFeeComponents(): Promise<FeeComponent[]> {
  const response = await apiClient.get<{ data: FeeComponent[] }>(
    "/fees/components/all",
  );
  return response.data;
}

async function createFeeComponent(
  data: CreateFeeComponentInput,
): Promise<FeeComponent> {
  const response = await apiClient.post<{ data: FeeComponent }>(
    "/fees/components",
    data,
  );
  return response.data;
}

async function updateFeeComponent({
  id,
  data,
}: {
  id: string;
  data: UpdateFeeComponentInput;
}): Promise<FeeComponent> {
  const response = await apiClient.patch<{ data: FeeComponent }>(
    `/fees/components/${id}`,
    data,
  );
  return response.data;
}

async function deleteFeeComponent(id: string): Promise<void> {
  await apiClient.delete(`/fees/components/${id}`);
}

export function useFeeComponents(params: FeeComponentsParams = {}) {
  return useQuery({
    queryKey: feeComponentsKeys.list(params),
    queryFn: () => fetchFeeComponents(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllFeeComponents() {
  return useQuery({
    queryKey: feeComponentsKeys.allActive(),
    queryFn: fetchAllFeeComponents,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFeeComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFeeComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeComponentsKeys.all });
    },
  });
}

export function useUpdateFeeComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFeeComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeComponentsKeys.all });
    },
  });
}

export function useDeleteFeeComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFeeComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feeComponentsKeys.all });
    },
  });
}

// =====================
// Batch Fee Structure
// =====================

export const batchFeeStructureKeys = {
  all: ["batch-fee-structure"] as const,
  list: (sessionId?: string) =>
    [...batchFeeStructureKeys.all, "list", sessionId] as const,
  byBatch: (batchId: string, sessionId: string) =>
    [...batchFeeStructureKeys.all, "batch", batchId, sessionId] as const,
  detail: (id: string) => [...batchFeeStructureKeys.all, "detail", id] as const,
};

async function fetchBatchFeeStructures(
  sessionId?: string,
): Promise<BatchFeeStructure[]> {
  const searchParams = new URLSearchParams();
  if (sessionId) searchParams.set("sessionId", sessionId);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/batch-structure?${queryString}`
    : "/fees/batch-structure";

  const response = await apiClient.get<{ data: BatchFeeStructure[] }>(endpoint);
  return response.data;
}

async function fetchBatchFeeStructureByBatch(
  batchId: string,
  sessionId: string,
): Promise<BatchFeeStructure | null> {
  const response = await apiClient.get<{ data: BatchFeeStructure | null }>(
    `/fees/batch-structure/${batchId}?sessionId=${sessionId}`,
  );
  return response.data;
}

async function createBatchFeeStructure(
  data: CreateBatchFeeStructureInput,
): Promise<BatchFeeStructure> {
  const response = await apiClient.post<{ data: BatchFeeStructure }>(
    "/fees/batch-structure",
    data,
  );
  return response.data;
}

async function applyBatchFeeStructureToStudents({
  id,
  overwriteExisting,
}: {
  id: string;
  overwriteExisting?: boolean;
}): Promise<{ applied: number; skipped: number; message: string }> {
  const response = await apiClient.post<{
    data: { applied: number; skipped: number; message: string };
  }>(`/fees/batch-structure/${id}/apply`, { overwriteExisting });
  return response.data;
}

export function useBatchFeeStructures(sessionId?: string) {
  return useQuery({
    queryKey: batchFeeStructureKeys.list(sessionId),
    queryFn: () => fetchBatchFeeStructures(sessionId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBatchFeeStructureByBatch(
  batchId: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: batchFeeStructureKeys.byBatch(batchId || "", sessionId || ""),
    queryFn: () => fetchBatchFeeStructureByBatch(batchId!, sessionId!),
    enabled: !!batchId && !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBatchFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBatchFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchFeeStructureKeys.all });
    },
  });
}

export function useApplyBatchFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyBatchFeeStructureToStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentFeeStructureKeys.all });
    },
  });
}

// =====================
// Student Fee Structure
// =====================

export const studentFeeStructureKeys = {
  all: ["student-fee-structure"] as const,
  byStudent: (studentId: string, sessionId?: string) =>
    [...studentFeeStructureKeys.all, "student", studentId, sessionId] as const,
  detail: (id: string) =>
    [...studentFeeStructureKeys.all, "detail", id] as const,
  summary: (studentId: string, sessionId?: string) =>
    [...studentFeeStructureKeys.all, "summary", studentId, sessionId] as const,
};

async function fetchStudentFeeStructure(
  studentId: string,
  sessionId: string,
): Promise<StudentFeeStructure | null> {
  const response = await apiClient.get<{ data: StudentFeeStructure | null }>(
    `/fees/student-structure/${studentId}?sessionId=${sessionId}`,
  );
  return response.data;
}

async function fetchStudentFeeStructureById(
  id: string,
): Promise<StudentFeeStructure> {
  const response = await apiClient.get<{ data: StudentFeeStructure }>(
    `/fees/student-structure/id/${id}`,
  );
  return response.data;
}

async function createStudentFeeStructure(
  data: CreateStudentFeeStructureInput,
): Promise<StudentFeeStructure> {
  const response = await apiClient.post<{ data: StudentFeeStructure }>(
    "/fees/student-structure",
    data,
  );
  return response.data;
}

async function fetchStudentFeeSummary(
  studentId: string,
  sessionId?: string,
): Promise<StudentFeeSummary> {
  const searchParams = new URLSearchParams();
  if (sessionId) searchParams.set("sessionId", sessionId);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/student-structure/summary/${studentId}?${queryString}`
    : `/fees/student-structure/summary/${studentId}`;

  const response = await apiClient.get<{ data: StudentFeeSummary }>(endpoint);
  return response.data;
}

export function useStudentFeeStructure(
  studentId: string | null,
  sessionId: string | null,
) {
  return useQuery({
    queryKey: studentFeeStructureKeys.byStudent(
      studentId || "",
      sessionId || undefined,
    ),
    queryFn: () => fetchStudentFeeStructure(studentId!, sessionId!),
    enabled: !!studentId && !!sessionId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentFeeStructureById(id: string | null) {
  return useQuery({
    queryKey: studentFeeStructureKeys.detail(id || ""),
    queryFn: () => fetchStudentFeeStructureById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateStudentFeeStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStudentFeeStructure,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: studentFeeStructureKeys.byStudent(variables.studentId),
      });
    },
  });
}

export function useStudentFeeSummary(
  studentId: string | null,
  sessionId?: string,
) {
  return useQuery({
    queryKey: studentFeeStructureKeys.summary(studentId || "", sessionId),
    queryFn: () => fetchStudentFeeSummary(studentId!, sessionId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

// =====================
// EMI Templates
// =====================

export const emiTemplateKeys = {
  all: ["emi-templates"] as const,
  list: () => [...emiTemplateKeys.all, "list"] as const,
  detail: (id: string) => [...emiTemplateKeys.all, "detail", id] as const,
};

async function fetchEMITemplates(): Promise<EMIPlanTemplate[]> {
  const response = await apiClient.get<{ data: EMIPlanTemplateApiResponse[] }>(
    "/emi-templates",
  );
  return response.data.map((tmpl) => ({
    ...tmpl,
    splitConfig: JSON.parse(tmpl.splitConfig),
  }));
}

async function createEMITemplate(
  data: CreateEMIPlanTemplateInput,
): Promise<EMIPlanTemplate> {
  const response = await apiClient.post<{ data: EMIPlanTemplate }>(
    "/emi-templates",
    data,
  );
  return response.data;
}

export function useEMITemplates() {
  return useQuery({
    queryKey: emiTemplateKeys.list(),
    queryFn: fetchEMITemplates,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateEMITemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEMITemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emiTemplateKeys.all });
    },
  });
}

// =====================
// Installments
// =====================

export interface PendingInstallmentsParams extends PaginationParams {
  status?: InstallmentStatus;
  batchId?: string;
}

export const installmentsKeys = {
  all: ["installments"] as const,
  pending: (params?: PendingInstallmentsParams) =>
    [...installmentsKeys.all, "pending", params] as const,
  student: (studentId: string, sessionId?: string) =>
    [...installmentsKeys.all, "student", studentId, sessionId] as const,
};

async function fetchPendingInstallments(
  params: PendingInstallmentsParams = {},
): Promise<PaginatedResponse<PendingInstallment>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.batchId) searchParams.set("batchId", params.batchId);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/installments/pending?${queryString}`
    : "/fees/installments/pending";

  return apiClient.get<PaginatedResponse<PendingInstallment>>(endpoint);
}

async function fetchStudentInstallments(
  studentId: string,
  sessionId?: string,
): Promise<
  Array<{
    sessionId: string;
    session: { id: string; name: string; isCurrent: boolean };
    netAmount: number;
    installments: FeeInstallment[];
  }>
> {
  const searchParams = new URLSearchParams();
  if (sessionId) searchParams.set("sessionId", sessionId);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/installments/${studentId}?${queryString}`
    : `/fees/installments/${studentId}`;

  const response = await apiClient.get<{
    data: Array<{
      sessionId: string;
      session: { id: string; name: string; isCurrent: boolean };
      netAmount: number;
      installments: FeeInstallment[];
    }>;
  }>(endpoint);
  return response.data;
}

async function generateInstallments(
  data: GenerateInstallmentsInput,
): Promise<FeeInstallment[]> {
  const response = await apiClient.post<{ data: FeeInstallment[] }>(
    "/fees/installments/generate",
    data,
  );
  return response.data;
}

async function recordInstallmentPayment({
  installmentId,
  data,
}: {
  installmentId: string;
  data: RecordInstallmentPaymentInput;
}): Promise<{ payment: unknown; installment: FeeInstallment }> {
  const response = await apiClient.post<{
    data: { payment: unknown; installment: FeeInstallment };
  }>(`/fees/installments/${installmentId}/payment`, data);
  return response.data;
}

async function deleteInstallments(feeStructureId: string): Promise<void> {
  await apiClient.delete(`/fees/installments?feeStructureId=${feeStructureId}`);
}

export function usePendingInstallments(params: PendingInstallmentsParams = {}) {
  return useQuery({
    queryKey: installmentsKeys.pending(params),
    queryFn: () => fetchPendingInstallments(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentInstallments(
  studentId: string | null,
  sessionId?: string,
) {
  return useQuery({
    queryKey: installmentsKeys.student(studentId || "", sessionId),
    queryFn: () => fetchStudentInstallments(studentId!, sessionId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGenerateInstallments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateInstallments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: studentFeeStructureKeys.all });
    },
  });
}

export function useRecordInstallmentPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordInstallmentPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: studentFeeStructureKeys.all });
    },
  });
}

export function useDeleteInstallments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInstallments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: studentFeeStructureKeys.all });
    },
  });
}
