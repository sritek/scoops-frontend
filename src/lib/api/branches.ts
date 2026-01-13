import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { Branch, CreateBranchInput, UpdateBranchInput } from "@/types/branch";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for branches list with filters
 */
export interface BranchesListParams extends PaginationParams {
  search?: string;
}

/**
 * Query keys for branches
 */
export const branchesKeys = {
  all: ["branches"] as const,
  list: (params?: BranchesListParams) =>
    [...branchesKeys.all, "list", params] as const,
  detail: (id: string) => [...branchesKeys.all, "detail", id] as const,
};

/**
 * Fetch branches with pagination
 */
async function fetchBranches(
  params: BranchesListParams = {}
): Promise<PaginatedResponse<Branch>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/branches?${queryString}` : "/branches";

  return apiClient.get<PaginatedResponse<Branch>>(endpoint);
}

/**
 * Fetch a single branch by ID
 */
async function fetchBranch(id: string): Promise<Branch> {
  const response = await apiClient.get<{ data: Branch }>(`/branches/${id}`);
  return response.data;
}

/**
 * Create a new branch
 */
async function createBranch(data: CreateBranchInput): Promise<Branch> {
  const response = await apiClient.post<{ data: Branch }>("/branches", data);
  return response.data;
}

/**
 * Update an existing branch
 */
async function updateBranch({
  id,
  data,
}: {
  id: string;
  data: UpdateBranchInput;
}): Promise<Branch> {
  const response = await apiClient.put<{ data: Branch }>(`/branches/${id}`, data);
  return response.data;
}

/**
 * Hook to fetch branches list with pagination
 */
export function useBranches(params: BranchesListParams = {}) {
  return useQuery({
    queryKey: branchesKeys.list(params),
    queryFn: () => fetchBranches(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single branch by ID
 */
export function useBranch(id: string | null) {
  return useQuery({
    queryKey: branchesKeys.detail(id || ""),
    queryFn: () => fetchBranch(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new branch
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
}

/**
 * Hook to update an existing branch
 */
export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBranch,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
      queryClient.invalidateQueries({
        queryKey: branchesKeys.detail(variables.id),
      });
    },
  });
}
