/**
 * Dashboard API Response Types
 * Matches backend GET /dashboard response
 */

export interface AttendanceSummary {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total students marked present today */
  totalPresent: number;
  /** Total students marked absent today */
  totalAbsent: number;
  /** Total attendance records marked */
  totalMarked: number;
  /** Total active students in branch */
  totalActiveStudents: number;
  /** Number of batches with attendance marked */
  batchesMarked: number;
  /** Number of batches pending attendance */
  batchesPending: number;
  /** Per-batch attendance breakdown */
  batchSummaries: BatchAttendanceSummary[];
  /** Batches without attendance today */
  pendingBatches: PendingBatch[];
}

export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  present: number;
  absent: number;
  total: number;
}

export interface PendingBatch {
  batchId: string;
  batchName: string;
  studentCount: number;
}

export interface PendingFeesSummary {
  /** Total number of pending fees */
  totalCount: number;
  /** Total pending amount in INR */
  totalPendingAmount: number;
  /** Number of overdue fees */
  overdueCount: number;
  /** Total overdue amount in INR */
  overdueAmount: number;
  /** Number of partially paid fees */
  partialCount: number;
  /** Number of fully pending fees */
  pendingCount: number;
}

export interface FeesCollectedToday {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Total number of payments received */
  totalCount: number;
  /** Total amount collected in INR */
  totalAmount: number;
  /** Breakdown by payment mode */
  byMode: {
    cash: PaymentModeStats;
    upi: PaymentModeStats;
    bank: PaymentModeStats;
  };
}

export interface PaymentModeStats {
  count: number;
  amount: number;
}

export interface DashboardData {
  attendance: AttendanceSummary;
  pendingFees: PendingFeesSummary;
  feesCollected: FeesCollectedToday;
}
