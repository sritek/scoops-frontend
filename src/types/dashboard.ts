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
  /** Attendance summary (null for accounts role) */
  attendance: AttendanceSummary | null;
  /** Pending fees summary (always present) */
  pendingFees: PendingFeesSummary;
  /** Fees collected today (null for teacher role) */
  feesCollected: FeesCollectedToday | null;
}

// =====================
// Enhanced Dashboard Types (Phase 2A)
// =====================

export interface ActionItem {
  type: "attendance_pending" | "fees_overdue" | "birthday" | "staff_unmarked";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionUrl?: string;
  count?: number;
}

export interface AttendanceTrendItem {
  date: string;
  present: number;
  absent: number;
  percentage: number;
}

export interface FeeCollectionTrendItem {
  date: string;
  amount: number;
  count: number;
}

export interface UpcomingBirthday {
  id: string;
  name: string;
  date: string;
  batchName: string | null;
  daysUntil: number;
}

export interface StaffAttendanceSummary {
  totalStaff: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  notMarked: number;
}

export interface EnhancedDashboardData {
  /** Attendance summary (null for accounts role) */
  attendance: AttendanceSummary | null;
  /** Pending fees summary */
  pendingFees: PendingFeesSummary | null;
  /** Fees collected today */
  feesCollected: FeesCollectedToday | null;
  /** Action items / todos */
  actionItems: ActionItem[];
  /** Trends data */
  trends?: {
    attendance?: AttendanceTrendItem[];
    feeCollection?: FeeCollectionTrendItem[];
  };
  /** Upcoming birthdays */
  upcomingBirthdays?: UpcomingBirthday[];
  /** Staff attendance summary (admin only) */
  staffAttendance?: StaffAttendanceSummary;
  /** Teacher's batch info (teacher only) */
  teacherBatch?: {
    id: string;
    name: string;
  } | null;
}
