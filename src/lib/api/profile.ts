import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { User, ApiResponse } from "@/types";

/**
 * Profile API endpoints and hooks
 */

// Query keys
export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

// API Types
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  photoUrl?: string | null;
}

/**
 * Fetch current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<User>("/auth/me");
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update current user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const response = await apiClient.put<ApiResponse<User>>("/auth/me", input);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the profile cache
      queryClient.setQueryData(profileKeys.me(), data);
      // Also update stored user in localStorage
      const storedUser = localStorage.getItem("scoops_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const updatedUser = {
            ...user,
            ...data,
            name: `${data.firstName} ${data.lastName}`.trim(),
          };
          localStorage.setItem("scoops_user", JSON.stringify(updatedUser));
        } catch {
          // Ignore parse errors
        }
      }
    },
  });
}
