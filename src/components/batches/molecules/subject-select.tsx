"use client";

import { useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { useAllSubjects } from "@/lib/api/subjects";
import { cn } from "@/lib/utils/cn";

interface SubjectSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

/**
 * SubjectSelect - Dropdown to select a subject
 * 
 * Fetches active subjects from the API and renders them in a select dropdown.
 */
export function SubjectSelect({
  value,
  onChange,
  placeholder = "Select subject",
  disabled = false,
  className,
  allowClear = true,
}: SubjectSelectProps) {
  const { data: subjects, isLoading } = useAllSubjects();

  const handleChange = (newValue: string) => {
    if (newValue === "__clear__") {
      onChange(undefined);
    } else {
      onChange(newValue);
    }
  };

  return (
    <Select
      value={value ?? ""}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && (
          <SelectItem value="__clear__" className="text-text-muted italic">
            None
          </SelectItem>
        )}
        {subjects?.map((subject) => (
          <SelectItem key={subject.id} value={subject.id}>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">
                {subject.code}
              </span>
              <span>{subject.name}</span>
            </span>
          </SelectItem>
        ))}
        {subjects?.length === 0 && !isLoading && (
          <div className="px-2 py-4 text-center text-sm text-text-muted">
            No subjects found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
