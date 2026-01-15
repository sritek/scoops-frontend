/**
 * Attendance API Types
 * Matches backend attendance endpoints
 */

import type { PaginationMeta } from "./index";

export type AttendanceStatus = "present" | "absent";

/**
 * Individual attendance record for a student
 */
export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
  markedAt?: string;
}

/**
 * Session info when attendance has been marked
 */
export interface AttendanceSession {
  id: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

/**
 * Full attendance response with pagination
 */
export interface AttendanceResponse {
  session: AttendanceSession | null;
  date: string;
  batchId: string;
  records: AttendanceRecord[];
  pagination?: PaginationMeta;
}

/**
 * Input for marking attendance
 */
export interface MarkAttendanceInput {
  batchId: string;
  date: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
  }[];
}

/**
 * Attendance history item (session with stats)
 */
export interface AttendanceHistoryItem {
  id: string;
  date: string;
  batchId: string;
  batchName: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  stats: {
    present: number;
    absent: number;
    total: number;
    attendanceRate: number;
  };
}

/**
 * Attendance history params for API
 */
export interface AttendanceHistoryParams {
  batchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Batch summary for dashboard
 */
export interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  present: number;
  absent: number;
  total: number;
}

/**
 * Pending batch (not yet marked today)
 */
export interface PendingBatch {
  batchId: string;
  batchName: string;
  studentCount: number;
}

/**
 * Today's attendance summary (from dashboard endpoint)
 */
export interface AttendanceSummary {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalMarked: number;
  totalActiveStudents: number;
  batchesMarked: number;
  batchesPending: number;
  batchSummaries: BatchAttendanceSummary[];
  pendingBatches: PendingBatch[];
}
