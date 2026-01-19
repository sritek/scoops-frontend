import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

/**
 * Settings API endpoints and hooks
 */

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  organization: () => [...settingsKeys.all, "organization"] as const,
  templates: () => [...settingsKeys.all, "templates"] as const,
  template: (id: string) => [...settingsKeys.all, "template", id] as const,
};

// API Types
export interface Organization {
  id: string;
  name: string;
  type: "school" | "coaching";
  language: string;
  timezone: string;
  udiseCode: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  // Notification settings
  notificationsEnabled: boolean;
  feeOverdueCheckTime: string;
  feeReminderDays: number;
  birthdayNotifications: boolean;
  attendanceBufferMinutes: number;
  // Feature flags
  jobsDashboardEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  type?: "school" | "coaching";
  language?: string;
  timezone?: string;
  udiseCode?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  // Notification settings
  notificationsEnabled?: boolean;
  feeOverdueCheckTime?: string;
  feeReminderDays?: number;
  birthdayNotifications?: boolean;
  attendanceBufferMinutes?: number;
  // Feature flags
  jobsDashboardEnabled?: boolean;
}

export type TemplateType = "absent" | "fee_due" | "fee_paid" | "fee_overdue" | "fee_reminder" | "birthday";

export interface MessageTemplate {
  id: string;
  type: TemplateType;
  name: string | null;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateTemplateInput {
  name?: string;
  content?: string;
  isActive?: boolean;
}

export interface CreateTemplateInput {
  type: TemplateType;
  name: string;
  content: string;
  isActive?: boolean;
}

/**
 * Fetch organization settings
 */
export function useOrganization() {
  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Organization }>(
        "/settings/organization"
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Update organization settings
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const response = await apiClient.put<ApiResponse<Organization>>(
        "/settings/organization",
        input
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.organization(), data);
    },
  });
}

/**
 * Fetch all message templates
 */
export function useMessageTemplates() {
  return useQuery({
    queryKey: settingsKeys.templates(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: MessageTemplate[] }>(
        "/settings/message-templates"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a message template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const response = await apiClient.post<ApiResponse<MessageTemplate>>(
        "/settings/message-templates",
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.templates() });
    },
  });
}

/**
 * Update a message template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateTemplateInput & { id: string }) => {
      const response = await apiClient.put<ApiResponse<MessageTemplate>>(
        `/settings/message-templates/${id}`,
        input
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.templates() });
    },
  });
}

/**
 * Delete a message template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/settings/message-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.templates() });
    },
  });
}
