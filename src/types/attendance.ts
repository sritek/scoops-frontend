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
