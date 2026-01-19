import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Batch, CreateBatchInput, UpdateBatchInput } from "@/types/batch";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Query keys for batches
 */
export const batchesKeys = {
  all: ["batches"] as const,
  list: (params?: PaginationParams) =>
    [...batchesKeys.all, "list", params] as const,
  detail: (id: string) => [...batchesKeys.all, "detail", id] as const,
};

/**
 * Fetch batches with pagination
 */
async function fetchBatches(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Batch>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/batches?${queryString}` : "/batches";

  return apiClient.get<PaginatedResponse<Batch>>(endpoint);
}

/**
 * Create a new batch
 */
async function createBatch(data: CreateBatchInput): Promise<Batch> {
  const response = await apiClient.post<{ data: Batch }>("/batches", data);
  return response.data;
}

/**
 * Fetch a single batch by ID
 */
async function fetchBatch(id: string): Promise<{ data: Batch }> {
  return apiClient.get<{ data: Batch }>(`/batches/${id}`);
}

/**
 * Update an existing batch
 */
async function updateBatch({
  id,
  data,
}: {
  id: string;
  data: UpdateBatchInput;
}): Promise<Batch> {
  const response = await apiClient.put<{ data: Batch }>(`/batches/${id}`, data);
  return response.data;
}

/**
 * Hook to fetch batches list with pagination
 *
 * @example
 * const { data, isLoading, error } = useBatches({ page: 1, limit: 20 });
 * // data.data = Batch[]
 * // data.pagination = { page, limit, total, totalPages, hasNext, hasPrev }
 */
export function useBatches(params: PaginationParams = {}) {
  return useQuery({
    queryKey: batchesKeys.list(params),
    queryFn: () => fetchBatches(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single batch by ID
 *
 * @example
 * const { data, isLoading, error } = useBatch("batch-id");
 * // data.data = Batch
 */
export function useBatch(id: string) {
  return useQuery({
    queryKey: batchesKeys.detail(id),
    queryFn: () => fetchBatch(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to create a new batch
 *
 * @example
 * const { mutate: createBatch, isPending } = useCreateBatch();
 * createBatch(formData, {
 *   onSuccess: () => closeDialog(),
 *   onError: (error) => setError(error.message),
 * });
 */
export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });
}

/**
 * Hook to update an existing batch
 *
 * @example
 * const { mutate: updateBatch, isPending } = useUpdateBatch();
 * updateBatch({ id: batchId, data: formData });
 */
export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: batchesKeys.all });
    },
  });
}
