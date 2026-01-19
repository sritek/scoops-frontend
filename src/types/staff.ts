/**
 * Staff API Types
 * Matches backend GET /staff response
 */

import type { UserRole } from "./user";

export type EmploymentType = "full_time" | "part_time" | "contract";
export type StaffAttendanceStatus = "present" | "absent" | "half_day" | "leave";
export type LeaveType = "casual" | "sick" | "earned" | "unpaid";

/**
 * Staff entity from API (extends User with staff-specific fields)
 */
export interface StaffEntity {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  role: UserRole;
  isActive: boolean;
  orgId: string;
  branchId: string;
  branchName: string | null;
  // Staff-specific fields
  employmentType: EmploymentType | null;
  joiningDate: string | null;
  department: string | null;
  designation: string | null;
  salary: number | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Update staff profile input
 */
export interface UpdateStaffProfileInput {
  employmentType?: EmploymentType | null;
  joiningDate?: string | null;
  department?: string | null;
  designation?: string | null;
  salary?: number | null;
  emergencyContact?: string | null;
}

/**
 * Staff attendance record
 */
export interface StaffAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: StaffAttendanceStatus;
  leaveType: LeaveType | null;
  notes: string | null;
  hoursWorked: number | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    employeeId: string;
    role: UserRole;
    department: string | null;
  };
}

/**
 * Today's attendance status for current user
 */
export interface MyTodayAttendance {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  attendance: StaffAttendanceRecord | null;
}

/**
 * Today's attendance summary
 */
export interface TodayAttendanceSummary {
  date: string;
  totalStaff: number;
  stats: {
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    notMarked: number;
  };
  attendance: StaffAttendanceRecord[];
}

/**
 * Unmarked staff member
 */
export interface UnmarkedStaff {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  employeeId: string;
  role: UserRole;
  department: string | null;
}

/**
 * Check-in/Check-out input
 */
export interface CheckInOutInput {
  notes?: string;
}

/**
 * Mark staff attendance input (admin)
 */
export interface MarkStaffAttendanceInput {
  userId: string;
  date: string;
  status: StaffAttendanceStatus;
  leaveType?: LeaveType;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}
