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
// Fee Component Types (Phase 3)
// =====================

export type FeeComponentType =
  | "tuition"
  | "admission"
  | "transport"
  | "lab"
  | "library"
  | "sports"
  | "exam"
  | "uniform"
  | "misc";

export type FeeStructureSource = "batch_default" | "custom";

/**
 * Fee Component
 */
export interface FeeComponent {
  id: string;
  orgId: string;
  name: string;
  type: FeeComponentType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create fee component input
 */
export interface CreateFeeComponentInput {
  name: string;
  type: FeeComponentType;
  description?: string;
}

/**
 * Update fee component input
 */
export interface UpdateFeeComponentInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// =====================
// Batch Fee Structure Types (Phase 3)
// =====================

/**
 * Fee line item (used in both batch and student structures)
 */
export interface FeeLineItem {
  id: string;
  feeComponentId: string;
  feeComponent: {
    id: string;
    name: string;
    type: FeeComponentType;
  };
  amount: number;
}

/**
 * Student fee line item with adjustments
 */
export interface StudentFeeLineItem extends FeeLineItem {
  originalAmount: number;
  adjustedAmount: number;
  waived: boolean;
  waiverReason: string | null;
}

/**
 * Batch Fee Structure
 */
export interface BatchFeeStructure {
  id: string;
  orgId: string;
  branchId: string;
  batchId: string;
  sessionId: string;
  name: string;
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  batch: {
    id: string;
    name: string;
  };
  session: {
    id: string;
    name: string;
  };
  lineItems: FeeLineItem[];
}

/**
 * Create batch fee structure input
 */
export interface CreateBatchFeeStructureInput {
  batchId: string;
  sessionId: string;
  name: string;
  lineItems: Array<{
    feeComponentId: string;
    amount: number;
  }>;
}

// =====================
// Student Fee Structure Types (Phase 3)
// =====================

/**
 * Student Fee Structure
 */
export interface StudentFeeStructure {
  id: string;
  studentId: string;
  sessionId: string;
  source: FeeStructureSource;
  batchFeeStructureId: string | null;
  grossAmount: number;
  scholarshipAmount: number;
  netAmount: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    name: string;
  };
  batchFeeStructure?: {
    id: string;
    name: string;
    totalAmount: number;
  } | null;
  lineItems: StudentFeeLineItem[];
  installments?: FeeInstallment[];
}

/**
 * Create student fee structure input
 */
export interface CreateStudentFeeStructureInput {
  studentId: string;
  sessionId: string;
  lineItems: Array<{
    feeComponentId: string;
    originalAmount: number;
    adjustedAmount: number;
    waived?: boolean;
    waiverReason?: string;
  }>;
  remarks?: string;
}

/**
 * Student fee summary
 */
export interface StudentFeeSummary {
  student: {
    id: string;
    fullName: string;
  };
  feeStructures: Array<{
    id: string;
    session: {
      id: string;
      name: string;
      isCurrent: boolean;
    };
    grossAmount: number;
    scholarshipAmount: number;
    netAmount: number;
    totalPaid: number;
    pendingAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    nextDue: {
      amount: number;
      dueDate: string;
    } | null;
  }>;
}

// =====================
// Installment Types (Phase 3)
// =====================

export type InstallmentStatus = "upcoming" | "due" | "overdue" | "partial" | "paid";

/**
 * Fee Installment
 */
export interface FeeInstallment {
  id: string;
  studentFeeStructureId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: InstallmentStatus;
  reminderSentAt: string | null;
  reminderCount: number;
  createdAt: string;
  updatedAt: string;
  payments?: InstallmentPayment[];
}

/**
 * Installment Payment
 */
export interface InstallmentPayment {
  id: string;
  installmentId: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef: string | null;
  receivedAt: string;
  remarks: string | null;
  receivedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Pending installment view
 */
export interface PendingInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: InstallmentStatus;
  student: {
    id: string;
    fullName: string;
    batch: {
      id: string;
      name: string;
    } | null;
  };
  session: {
    id: string;
    name: string;
  };
}

/**
 * Record installment payment input
 */
export interface RecordInstallmentPaymentInput {
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  remarks?: string;
}

// =====================
// EMI Template Types (Phase 3)
// =====================

/**
 * EMI Split configuration
 */
export interface EMISplitConfig {
  percent: number;
  dueDaysFromStart: number;
}

/**
 * EMI Plan Template
 */
export interface EMIPlanTemplate {
  id: string;
  orgId: string;
  name: string;
  installmentCount: number;
  splitConfig: EMISplitConfig[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create EMI template input
 */
export interface CreateEMIPlanTemplateInput {
  name: string;
  installmentCount: number;
  splitConfig: EMISplitConfig[];
  isDefault?: boolean;
}

/**
 * Generate installments input
 */
export interface GenerateInstallmentsInput {
  studentFeeStructureId: string;
  emiTemplateId: string;
  startDate: string;
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
