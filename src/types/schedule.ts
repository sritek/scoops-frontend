/**
 * Schedule & Period Template Types
 */

import type { Subject } from "./subject";

// ===========================
// Period Template Types
// ===========================

export interface PeriodTemplateSlot {
  id: string;
  templateId: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakName?: string;
}

export interface PeriodTemplate {
  id: string;
  orgId: string;
  name: string;
  isDefault: boolean;
  activeDays: number[]; // 1=Mon to 6=Sat
  slots: PeriodTemplateSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePeriodTemplateInput {
  name: string;
  isDefault?: boolean;
  activeDays?: number[];
  slots: Omit<PeriodTemplateSlot, "id" | "templateId">[];
}

export interface UpdatePeriodTemplateInput {
  name?: string;
  isDefault?: boolean;
  activeDays?: number[];
  slots?: Omit<PeriodTemplateSlot, "id" | "templateId">[];
}

// ===========================
// Schedule Period Types
// ===========================

export interface ScheduleTeacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ScheduleSubject {
  id: string;
  name: string;
  code: string;
}

export interface Period {
  id: string;
  batchId: string;
  dayOfWeek: number; // 1=Mon to 6=Sat
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  teacherId?: string;
  subject?: ScheduleSubject;
  teacher?: ScheduleTeacher;
}

export interface PeriodInput {
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  teacherId?: string;
}

export interface UpdatePeriodInput {
  subjectId?: string | null;
  teacherId?: string | null;
}

// ===========================
// Day of Week Constants
// ===========================

export const DAYS_OF_WEEK = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

/**
 * Default active days (Mon-Sat)
 */
export const DEFAULT_ACTIVE_DAYS = [1, 2, 3, 4, 5, 6];

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]["value"];

export function getDayLabel(day: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? "";
}

export function getDayShortLabel(day: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.short ?? "";
}

// ===========================
// Default Period Template
// ===========================

export const DEFAULT_PERIOD_SLOTS: Omit<PeriodTemplateSlot, "id" | "templateId">[] = [
  { periodNumber: 1, startTime: "08:00", endTime: "08:45", isBreak: false },
  { periodNumber: 2, startTime: "08:45", endTime: "09:30", isBreak: false },
  { periodNumber: 3, startTime: "09:30", endTime: "10:15", isBreak: false },
  { periodNumber: 0, startTime: "10:15", endTime: "10:30", isBreak: true, breakName: "Recess" },
  { periodNumber: 4, startTime: "10:30", endTime: "11:15", isBreak: false },
  { periodNumber: 5, startTime: "11:15", endTime: "12:00", isBreak: false },
  { periodNumber: 0, startTime: "12:00", endTime: "12:45", isBreak: true, breakName: "Lunch" },
  { periodNumber: 6, startTime: "12:45", endTime: "13:30", isBreak: false },
  { periodNumber: 7, startTime: "13:30", endTime: "14:15", isBreak: false },
  { periodNumber: 8, startTime: "14:15", endTime: "15:00", isBreak: false },
];
