import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Period,
  PeriodInput,
  UpdatePeriodInput,
  PeriodTemplate,
  CreatePeriodTemplateInput,
  UpdatePeriodTemplateInput,
} from "@/types/schedule";
import type { PaginatedResponse, PaginationParams } from "@/types";
import { batchesKeys } from "./batches";

// ===========================
// PERIOD TEMPLATE API
// ===========================

export const periodTemplatesKeys = {
  all: ["periodTemplates"] as const,
  list: (params?: PaginationParams) =>
    [...periodTemplatesKeys.all, "list", params] as const,
  allTemplates: () => [...periodTemplatesKeys.all, "allTemplates"] as const,
  default: () => [...periodTemplatesKeys.all, "default"] as const,
  detail: (id: string) => [...periodTemplatesKeys.all, "detail", id] as const,
};

/**
 * Fetch period templates with pagination
 */
async function fetchPeriodTemplates(
  params: PaginationParams = {}
): Promise<PaginatedResponse<PeriodTemplate>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/period-templates?${queryString}`
    : "/period-templates";

  return apiClient.get<PaginatedResponse<PeriodTemplate>>(endpoint);
}

/**
 * Fetch all templates (for dropdowns)
 */
async function fetchAllTemplates(): Promise<PeriodTemplate[]> {
  const response = await apiClient.get<{ data: PeriodTemplate[] }>(
    "/period-templates/all"
  );
  return response.data;
}

/**
 * Fetch default template
 */
async function fetchDefaultTemplate(): Promise<PeriodTemplate> {
  const response = await apiClient.get<{ data: PeriodTemplate }>(
    "/period-templates/default"
  );
  return response.data;
}

/**
 * Create a new period template
 */
async function createPeriodTemplate(
  data: CreatePeriodTemplateInput
): Promise<PeriodTemplate> {
  const response = await apiClient.post<{ data: PeriodTemplate }>(
    "/period-templates",
    data
  );
  return response.data;
}

/**
 * Update an existing period template
 */
async function updatePeriodTemplate({
  id,
  data,
}: {
  id: string;
  data: UpdatePeriodTemplateInput;
}): Promise<PeriodTemplate> {
  const response = await apiClient.put<{ data: PeriodTemplate }>(
    `/period-templates/${id}`,
    data
  );
  return response.data;
}

/**
 * Hook to fetch period templates list
 */
export function usePeriodTemplates(params: PaginationParams = {}) {
  return useQuery({
    queryKey: periodTemplatesKeys.list(params),
    queryFn: () => fetchPeriodTemplates(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch all templates (for dropdowns)
 */
export function useAllPeriodTemplates() {
  return useQuery({
    queryKey: periodTemplatesKeys.allTemplates(),
    queryFn: fetchAllTemplates,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch default template
 */
export function useDefaultPeriodTemplate() {
  return useQuery({
    queryKey: periodTemplatesKeys.default(),
    queryFn: fetchDefaultTemplate,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new period template
 */
export function useCreatePeriodTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPeriodTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodTemplatesKeys.all });
    },
  });
}

/**
 * Hook to update a period template
 */
export function useUpdatePeriodTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePeriodTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodTemplatesKeys.all });
    },
  });
}

/**
 * Fetch a single period template by ID
 */
async function fetchPeriodTemplate(id: string): Promise<PeriodTemplate> {
  const response = await apiClient.get<{ data: PeriodTemplate }>(
    `/period-templates/${id}`
  );
  return response.data;
}

/**
 * Delete a period template
 */
async function deletePeriodTemplate(id: string): Promise<void> {
  await apiClient.delete(`/period-templates/${id}`);
}

/**
 * Hook to fetch a single period template
 */
export function usePeriodTemplate(id: string) {
  return useQuery({
    queryKey: periodTemplatesKeys.detail(id),
    queryFn: () => fetchPeriodTemplate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to delete a period template
 */
export function useDeletePeriodTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePeriodTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodTemplatesKeys.all });
    },
  });
}

// ===========================
// BATCH SCHEDULE API
// ===========================

export const scheduleKeys = {
  batch: (batchId: string) => ["schedule", batchId] as const,
};

/**
 * Fetch batch schedule
 */
async function fetchBatchSchedule(batchId: string): Promise<Period[]> {
  const response = await apiClient.get<{ data: Period[] }>(
    `/batches/${batchId}/schedule`
  );
  return response.data;
}

/**
 * Set batch schedule
 */
async function setBatchSchedule({
  batchId,
  periods,
}: {
  batchId: string;
  periods: PeriodInput[];
}): Promise<Period[]> {
  const response = await apiClient.put<{ data: Period[] }>(
    `/batches/${batchId}/schedule`,
    { periods }
  );
  return response.data;
}

/**
 * Update a single period
 */
async function updatePeriod({
  batchId,
  day,
  period,
  data,
}: {
  batchId: string;
  day: number;
  period: number;
  data: UpdatePeriodInput;
}): Promise<Period> {
  const response = await apiClient.patch<{ data: Period }>(
    `/batches/${batchId}/schedule/${day}/${period}`,
    data
  );
  return response.data;
}

/**
 * Initialize schedule from template
 */
async function initializeSchedule({
  batchId,
  templateId,
}: {
  batchId: string;
  templateId: string;
}): Promise<Period[]> {
  const response = await apiClient.post<{ data: Period[] }>(
    `/batches/${batchId}/schedule/initialize`,
    { templateId }
  );
  return response.data;
}

/**
 * Hook to fetch batch schedule
 */
export function useBatchSchedule(batchId: string) {
  return useQuery({
    queryKey: scheduleKeys.batch(batchId),
    queryFn: () => fetchBatchSchedule(batchId),
    enabled: !!batchId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to set batch schedule
 */
export function useSetBatchSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setBatchSchedule,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.batch(variables.batchId),
      });
      queryClient.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });
}

/**
 * Hook to update a single period
 */
export function useUpdatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePeriod,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.batch(variables.batchId),
      });
    },
  });
}

/**
 * Hook to initialize schedule from template
 */
export function useInitializeSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initializeSchedule,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.batch(variables.batchId),
      });
      queryClient.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });
}

// ===========================
// BATCH NAME GENERATION
// ===========================

/**
 * Generate batch name
 */
async function generateBatchName(params: {
  academicLevel: string;
  stream?: string;
  sessionName?: string;
}): Promise<string> {
  const response = await apiClient.post<{ data: { name: string } }>(
    "/batches/generate-name",
    params
  );
  return response.data.name;
}

/**
 * Hook to generate batch name
 */
export function useGenerateBatchName() {
  return useMutation({
    mutationFn: generateBatchName,
  });
}
