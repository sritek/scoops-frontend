/**
 * Payment Link Types
 */

export type PaymentLinkStatus = "active" | "expired" | "paid" | "cancelled";

export interface PaymentLink {
  id: string;
  shortCode: string;
  amount: number;
  description: string | null;
  status: PaymentLinkStatus;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
  paymentUrl: string;
  studentName: string;
  feePlanName: string;
  createdBy?: string;
}

export interface CreatePaymentLinkInput {
  studentFeeId: string;
  expiresInDays?: number;
  description?: string;
}

export interface PaymentLinkFilters {
  status?: PaymentLinkStatus;
  studentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Public payment link details (no auth required)
 */
export interface PublicPaymentLink {
  id: string;
  shortCode: string;
  amount: number;
  description: string | null;
  status: PaymentLinkStatus;
  expiresAt: string;
  razorpayUrl: string | null;
  student: {
    name: string;
    batchName: string | null;
  };
  feePlan: string;
  organization: {
    name: string;
    logoUrl: string | null;
  } | null;
}
