import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, getStoredToken } from "./client";
import { config } from "@/config";
import type { Receipt, ReceiptDetails } from "@/types/fee";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for receipts list with filters
 */
export interface ReceiptsParams extends PaginationParams {
  studentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Query keys for fees
 */
export const feesKeys = {
  all: ["fees"] as const,
  receipts: {
    all: ["receipts"] as const,
    list: (params?: ReceiptsParams) =>
      [...feesKeys.receipts.all, "list", params] as const,
    detail: (id: string) => [...feesKeys.receipts.all, "detail", id] as const,
  },
};

// =====================
// Receipt Functions & Hooks
// =====================

/**
 * Fetch receipts with pagination and filters
 * Returns receipts that reference InstallmentPayment
 */
async function fetchReceipts(
  params: ReceiptsParams = {},
): Promise<PaginatedResponse<Receipt>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.studentId) searchParams.set("studentId", params.studentId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/fees/receipts?${queryString}`
    : "/fees/receipts";

  return apiClient.get<PaginatedResponse<Receipt>>(endpoint);
}

/**
 * Fetch a single receipt by ID
 * Returns receipt details with InstallmentPayment reference
 */
async function fetchReceipt(id: string): Promise<ReceiptDetails> {
  const response = await apiClient.get<{ data: ReceiptDetails }>(
    `/fees/receipts/${id}`,
  );
  return response.data;
}

/**
 * Download receipt PDF
 * Returns the PDF blob
 */
export async function downloadReceiptPDF(id: string): Promise<Blob> {
  const response = await fetch(
    `${config.api.baseUrl}/fees/receipts/${id}/pdf`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("scoops_token")}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to download receipt");
  }

  return response.blob();
}

/**
 * Download payment summary PDF
 * Returns the PDF blob
 */
export async function downloadPaymentSummaryPDF(paymentId: string): Promise<Blob> {
  const token = getStoredToken();
  const response = await fetch(
    `${config.api.baseUrl}/fees/payments/${paymentId}/summary-pdf`,
    {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error("Failed to download payment summary");
  }

  return response.blob();
}

/**
 * Send receipt via WhatsApp
 */
async function sendReceiptViaWhatsApp(
  id: string,
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/fees/receipts/${id}/send`, {});
}

/**
 * Hook to fetch receipts
 * Returns receipts that reference InstallmentPayment
 */
export function useReceipts(params: ReceiptsParams = {}) {
  return useQuery({
    queryKey: feesKeys.receipts.list(params),
    queryFn: () => fetchReceipts(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single receipt
 * Returns receipt details with InstallmentPayment reference
 */
export function useReceipt(id: string | null) {
  return useQuery({
    queryKey: feesKeys.receipts.detail(id || ""),
    queryFn: () => fetchReceipt(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to send receipt via WhatsApp
 */
export function useSendReceiptViaWhatsApp() {
  return useMutation({
    mutationFn: sendReceiptViaWhatsApp,
  });
}
