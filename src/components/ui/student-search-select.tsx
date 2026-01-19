"use client";

import { useMemo } from "react";
import { useStudents } from "@/lib/api/students";
import { SearchableSelect } from "./searchable-select";
import type { Student } from "@/types/student";

export interface StudentSearchSelectProps {
  /** Filter students by batch ID */
  batchId?: string;
  /** Currently selected student ID */
  value?: string;
  /** Called when selection changes with full Student object */
  onChange: (student: Student | undefined) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Disable the select */
  disabled?: boolean;
}

/**
 * StudentSearchSelect - A searchable dropdown for selecting students
 *
 * Uses the useStudents hook to fetch students filtered by batchId,
 * and wraps SearchableSelect for the UI.
 *
 * Returns the full Student object (including parents) on selection.
 */
export function StudentSearchSelect({
  batchId,
  value,
  onChange,
  placeholder = "Select a student...",
  disabled = false,
}: StudentSearchSelectProps) {
  // Fetch students, filtered by batch if provided
  const { data, isLoading } = useStudents({
    batchId,
    limit: 100,
    status: "active",
  });

  const students = data?.data ?? [];

  // Convert students to SearchableSelect options
  const options = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: student.fullName,
        sublabel: student.batchName ?? undefined,
      })),
    [students]
  );

  // Create a map for quick student lookup
  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const handleChange = (studentId: string | undefined) => {
    if (!studentId) {
      onChange(undefined);
      return;
    }
    const student = studentMap.get(studentId);
    onChange(student);
  };

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      searchPlaceholder="Search students..."
      emptyMessage="No students found."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
}
