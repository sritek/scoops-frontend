/**
 * Report Types
 */

export type ReportType =
  | "attendance_monthly"
  | "attendance_batch"
  | "fee_collection"
  | "fee_defaulters"
  | "student_performance"
  | "branch_summary";

export type ReportFormat = "pdf" | "excel";

export type ReportStatus = "pending" | "generating" | "completed" | "failed";

export interface Report {
  id: string;
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, unknown>;
  status: ReportStatus;
  filePath: string | null;
  createdAt: string;
  completedAt: string | null;
  requestedBy: string;
}

export interface RequestReportInput {
  type: ReportType;
  format: ReportFormat;
  parameters?: {
    startDate?: string;
    endDate?: string;
    batchId?: string;
    month?: number;
    year?: number;
  };
}

export interface ReportTypeInfo {
  type: ReportType;
  name: string;
  description: string;
  parameters: string[];
}

export interface ReportFilters {
  type?: ReportType;
  status?: ReportStatus;
  page?: number;
  limit?: number;
}
