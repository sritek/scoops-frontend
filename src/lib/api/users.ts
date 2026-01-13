import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  UserEntity,
  CreateUserInput,
  UpdateUserInput,
  CreateUserResponse,
  UserRole,
} from "@/types/user";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for users list with filters
 */
export interface UsersListParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

/**
 * Query keys for users
 */
export const usersKeys = {
  all: ["users"] as const,
  list: (params?: UsersListParams) =>
    [...usersKeys.all, "list", params] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

/**
 * Fetch users with pagination and filters
 */
async function fetchUsers(
  params: UsersListParams = {}
): Promise<PaginatedResponse<UserEntity>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.role) searchParams.set("role", params.role);
  if (params.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/users?${queryString}` : "/users";

  return apiClient.get<PaginatedResponse<UserEntity>>(endpoint);
}

/**
 * Fetch a single user by ID
 */
async function fetchUser(id: string): Promise<UserEntity> {
  const response = await apiClient.get<{ data: UserEntity }>(`/users/${id}`);
  return response.data;
}

/**
 * Create a new user
 */
async function createUser(data: CreateUserInput): Promise<CreateUserResponse> {
  const response = await apiClient.post<{ data: CreateUserResponse; message: string }>(
    "/users",
    data
  );
  return response.data;
}

/**
 * Update an existing user
 */
async function updateUser({
  id,
  data,
}: {
  id: string;
  data: UpdateUserInput;
}): Promise<UserEntity> {
  const response = await apiClient.put<{ data: UserEntity }>(`/users/${id}`, data);
  return response.data;
}

/**
 * Deactivate a user
 */
async function deleteUser(id: string): Promise<UserEntity> {
  const response = await apiClient.delete<{ data: UserEntity }>(`/users/${id}`);
  return response.data;
}

/**
 * Reset user password
 */
async function resetUserPassword(id: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/users/${id}/reset-password`, {});
}

/**
 * Hook to fetch users list with pagination and filters
 */
export function useUsers(params: UsersListParams = {}) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: usersKeys.detail(id || ""),
    queryFn: () => fetchUser(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

/**
 * Hook to update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to deactivate a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: resetUserPassword,
  });
}
