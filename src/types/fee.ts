/**
 * Fee API Types
 * Matches backend GET /fees response
 */

export type FeeFrequency = "monthly" | "custom";
export type FeeStatus = "pending" | "partial" | "paid";
export type PaymentMode = "cash" | "upi" | "bank";

/**
 * Fee Plan (template for fees)
 */
export interface FeePlan {
  id: string;
  orgId: string;
  branchId: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Student fee record
 */
export interface StudentFee {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  feePlan: {
    id: string;
    name: string;
  };
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: FeeStatus;
}

/**
 * Fee payment record
 */
export interface FeePayment {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  receivedAt: string;
  receivedBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

/**
 * Student fee with payments
 */
export interface StudentFeeWithPayments extends StudentFee {
  payments: FeePayment[];
}

/**
 * Student fees response
 */
export interface StudentFeesResponse {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  fees: StudentFeeWithPayments[];
}

/**
 * Create fee plan input
 */
export interface CreateFeePlanInput {
  name: string;
  amount: number;
  frequency: FeeFrequency;
}

/**
 * Assign fee input
 */
export interface AssignFeeInput {
  studentId: string;
  feePlanId: string;
  dueDate: string;
  totalAmount?: number;
}

/**
 * Record payment input
 */
export interface RecordPaymentInput {
  studentFeeId: string;
  amount: number;
  paymentMode: PaymentMode;
  notes?: string;
}

// =====================
// Receipt Types
// =====================

/**
 * Receipt entity from API
 */
export interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  generatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  feePlan: {
    id: string;
    name: string;
  };
  receivedBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

/**
 * Detailed receipt with organization info
 */
export interface ReceiptDetails extends Receipt {
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    logoUrl: string | null;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    batch: {
      id: string;
      name: string;
    } | null;
  };
  studentFee: {
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    status: FeeStatus;
  };
}
