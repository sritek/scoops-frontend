"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/ui";
import { useUsers } from "@/lib/api/users";

interface TeacherSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

/**
 * TeacherSelect - Searchable dropdown to select a teacher
 *
 * Loads all teachers upfront and provides client-side search filtering.
 * Suitable for organizations with up to ~100 teachers.
 */
export function TeacherSelect({
  value,
  onChange,
  placeholder = "Select teacher",
  disabled = false,
  className,
  allowClear = true,
}: TeacherSelectProps) {
  // Fetch all active teachers
  const { data: teachersData, isLoading } = useUsers({
    role: "teacher",
    isActive: true,
    limit: 100,
  });

  // Transform to SearchableSelect options format
  const options = useMemo(() => {
    return (teachersData?.data ?? []).map((teacher) => ({
      value: teacher.id,
      label: teacher.fullName || `${teacher.firstName} ${teacher.lastName}`,
    }));
  }, [teachersData]);

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search teachers..."
      emptyMessage="No teachers found."
      disabled={disabled}
      isLoading={isLoading}
      allowClear={allowClear}
      className={className}
    />
  );
}
