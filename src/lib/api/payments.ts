/**
 * Payment Links API Client
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  PaymentLink,
  CreatePaymentLinkInput,
  PaymentLinkFilters,
  PublicPaymentLink,
} from "@/types/payment";
import type { PaginatedResponse } from "@/types";

// Query keys
export const paymentLinkKeys = {
  all: ["payment-links"] as const,
  lists: () => [...paymentLinkKeys.all, "list"] as const,
  list: (filters: PaymentLinkFilters) =>
    [...paymentLinkKeys.lists(), filters] as const,
  details: () => [...paymentLinkKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentLinkKeys.details(), id] as const,
  public: (shortCode: string) => ["public-payment", shortCode] as const,
};

/**
 * Fetch payment links
 */
export async function fetchPaymentLinks(
  filters: PaymentLinkFilters = {}
): Promise<PaginatedResponse<PaymentLink>> {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.status) params.append("status", filters.status);
  if (filters.studentId) params.append("studentId", filters.studentId);
  if (filters.search) params.append("search", filters.search);

  return apiClient.get(`/payment-links?${params.toString()}`);
}

/**
 * Fetch single payment link
 */
export async function fetchPaymentLink(id: string): Promise<PaymentLink> {
  const response = await apiClient.get<{ data: PaymentLink }>(`/payment-links/${id}`);
  return response.data;
}

/**
 * Create payment link
 */
export async function createPaymentLink(
  input: CreatePaymentLinkInput
): Promise<PaymentLink> {
  const response = await apiClient.post<{ data: PaymentLink }>("/payment-links", input);
  return response.data;
}

/**
 * Cancel payment link
 */
export async function cancelPaymentLink(id: string): Promise<void> {
  await apiClient.delete(`/payment-links/${id}`);
}

/**
 * Fetch public payment link (no auth)
 */
export async function fetchPublicPaymentLink(
  shortCode: string
): Promise<PublicPaymentLink> {
  const response = await apiClient.get<{ data: PublicPaymentLink }>(`/pay/${shortCode}`, { skipAuth: true });
  return response.data;
}

// React Query Hooks

/**
 * Hook to fetch payment links
 */
export function usePaymentLinks(filters: PaymentLinkFilters = {}) {
  return useQuery({
    queryKey: paymentLinkKeys.list(filters),
    queryFn: () => fetchPaymentLinks(filters),
  });
}

/**
 * Hook to fetch single payment link
 */
export function usePaymentLink(id: string) {
  return useQuery({
    queryKey: paymentLinkKeys.detail(id),
    queryFn: () => fetchPaymentLink(id),
    enabled: !!id,
  });
}

/**
 * Hook to create payment link
 */
export function useCreatePaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaymentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentLinkKeys.lists() });
    },
  });
}

/**
 * Hook to cancel payment link
 */
export function useCancelPaymentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPaymentLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentLinkKeys.lists() });
    },
  });
}

/**
 * Hook to fetch public payment link (no auth)
 */
export function usePublicPaymentLink(shortCode: string) {
  return useQuery({
    queryKey: paymentLinkKeys.public(shortCode),
    queryFn: () => fetchPublicPaymentLink(shortCode),
    enabled: !!shortCode,
    retry: false,
  });
}
