/**
 * Fee API Types
 * Consolidated fee system using FeeComponent, BatchFeeStructure,
 * StudentFeeStructure, FeeInstallment, and InstallmentPayment
 */

export type PaymentMode = "cash" | "upi" | "bank";

// =====================
// Custom Discount Types
// =====================

/**
 * Custom discount type - percentage or fixed amount
 */
export type CustomDiscountType = "percentage" | "fixed_amount";

/**
 * Custom discount input for student creation
 */
export interface CustomDiscountInput {
  type: CustomDiscountType;
  value: number;
  remarks?: string;
}

/**
 * Custom discount display data (from StudentFeeStructure)
 */
export interface CustomDiscountDisplay {
  type: CustomDiscountType;
  value: number;
  amount: number;
  remarks: string | null;
}

/**
 * Get human-readable custom discount type label
 */
export function getCustomDiscountTypeLabel(type: CustomDiscountType): string {
  switch (type) {
    case "percentage":
      return "Percentage Discount";
    case "fixed_amount":
      return "Fixed Amount";
    default:
      return type;
  }
}

/**
 * Format custom discount value for display
 * @param discount - The custom discount data
 * @returns Formatted string like "10%" or "₹5,000"
 */
export function formatCustomDiscountValue(discount: {
  type: CustomDiscountType;
  value: number;
}): string {
  switch (discount.type) {
    case "percentage":
      return `${discount.value}%`;
    case "fixed_amount":
      return `₹${discount.value.toLocaleString("en-IN")}`;
    default:
      return String(discount.value);
  }
}

/**
 * Format custom discount for full display (type + value + calculated amount)
 * @param discount - The custom discount data with calculated amount
 * @returns Formatted string like "10% (₹5,000)" or "₹5,000"
 */
export function formatCustomDiscountDisplay(
  discount: CustomDiscountDisplay,
): string {
  if (discount.type === "percentage") {
    return `${discount.value}% (₹${discount.amount.toLocaleString("en-IN")})`;
  }
  return `₹${discount.amount.toLocaleString("en-IN")}`;
}

// =====================
// Fee Component Types
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
  lineItems?: FeeLineItem[];
  _count?: {
    lineItems: number;
  };
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
  // Custom discount fields
  customDiscountType: CustomDiscountType | null;
  customDiscountValue: number | null;
  customDiscountAmount: number | null;
  customDiscountRemarks: string | null;
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
 * Helper to extract custom discount display data from StudentFeeStructure
 * Returns null if no custom discount is applied
 */
export function getCustomDiscountFromFeeStructure(
  feeStructure: StudentFeeStructure,
): CustomDiscountDisplay | null {
  if (
    !feeStructure.customDiscountType ||
    feeStructure.customDiscountValue === null ||
    feeStructure.customDiscountAmount === null
  ) {
    return null;
  }

  return {
    type: feeStructure.customDiscountType,
    value: feeStructure.customDiscountValue,
    amount: feeStructure.customDiscountAmount,
    remarks: feeStructure.customDiscountRemarks,
  };
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
    customDiscount: CustomDiscountDisplay | null;
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

export type InstallmentStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "partial"
  | "paid";

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

export interface EMIPlanTemplateApiResponse {
  id: string;
  orgId: string;
  name: string;
  installmentCount: number;
  splitConfig: string | EMISplitConfig[];
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
 * Update EMI template input (all optional)
 */
export interface UpdateEMIPlanTemplateInput {
  name?: string;
  splitConfig?: EMISplitConfig[];
  isDefault?: boolean;
  isActive?: boolean;
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
 * Receipt entity from API (references InstallmentPayment)
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
  installment: {
    id: string;
    installmentNumber: number;
    dueDate: string;
    amount: number;
  };
  session: {
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
 * Detailed receipt with organization info (references InstallmentPayment)
 */
export interface ReceiptDetails {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  generatedAt: string;
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
  session: {
    id: string;
    name: string;
  };
  feeStructure: {
    id: string;
    grossAmount: number;
    scholarshipAmount: number;
    netAmount: number;
    lineItems: Array<{
      id: string;
      feeComponent: {
        id: string;
        name: string;
        type: FeeComponentType;
      };
      originalAmount: number;
      adjustedAmount: number;
      waived: boolean;
    }>;
  };
  installment: {
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidAmount: number;
    status: InstallmentStatus;
  };
  receivedBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}
