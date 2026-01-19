"use client";

import { useMemo } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { useSessions } from "@/lib/api/sessions";
import { cn } from "@/lib/utils/cn";

interface SessionSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

/**
 * SessionSelect - Dropdown to select an academic session
 * 
 * Fetches sessions from the API and renders them in a select dropdown.
 * Current session is highlighted.
 */
export function SessionSelect({
  value,
  onChange,
  placeholder = "Select session",
  disabled = false,
  className,
  allowClear = true,
}: SessionSelectProps) {
  const { data: sessionsData, isLoading } = useSessions({ limit: 20 });

  const sessions = useMemo(() => {
    return sessionsData?.data ?? [];
  }, [sessionsData]);

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
        {sessions.map((session) => (
          <SelectItem key={session.id} value={session.id}>
            <span className="flex items-center gap-2">
              <span>{session.name}</span>
              {session.isCurrent && (
                <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success font-medium">
                  Current
                </span>
              )}
            </span>
          </SelectItem>
        ))}
        {sessions.length === 0 && !isLoading && (
          <div className="px-2 py-4 text-center text-sm text-text-muted">
            No sessions found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
