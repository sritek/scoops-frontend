/**
 * Analytics Types
 */

export interface BranchMetrics {
  id: string;
  name: string;
  studentCount: number;
  staffCount: number;
  batchCount: number;
  attendanceRate: number;
  feeCollectionRate: number;
  totalFeesCollected: number;
  totalFeesPending: number;
}

export interface BranchComparisonTotals {
  totalStudents: number;
  totalStaff: number;
  totalBatches: number;
  avgAttendanceRate: number;
  avgFeeCollectionRate: number;
  totalFeesCollected: number;
  totalFeesPending: number;
}

export interface BranchComparison {
  branches: BranchMetrics[];
  totals: BranchComparisonTotals;
}

export interface TrendDataPoint {
  date: string;
  rate?: number;
  amount?: number;
}

export interface BatchInfo {
  id: string;
  name: string;
  studentCount: number;
}

export interface BranchPerformance {
  branchName: string;
  metrics: {
    totalStudents: number;
    totalBatches: number;
    avgBatchSize: number;
    attendanceRate: number;
    feeCollectionRate: number;
    openComplaints: number;
  };
  batches: BatchInfo[];
  trends: {
    attendance: TrendDataPoint[];
    feeCollection: TrendDataPoint[];
  };
}

export interface OrgStats {
  totalStudents: number;
  totalBranches: number;
  totalStaff: number;
  pendingFees: number;
  monthlyCollection: number;
}
