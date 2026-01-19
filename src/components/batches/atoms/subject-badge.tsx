"use client";

import { cn } from "@/lib/utils/cn";

// Subject color palette - maps to common subjects
const SUBJECT_COLORS: Record<string, string> = {
  MATH: "bg-blue-100 text-blue-700 border-blue-200",
  SCI: "bg-green-100 text-green-700 border-green-200",
  ENG: "bg-purple-100 text-purple-700 border-purple-200",
  HIN: "bg-orange-100 text-orange-700 border-orange-200",
  SST: "bg-amber-100 text-amber-700 border-amber-200",
  PHY: "bg-cyan-100 text-cyan-700 border-cyan-200",
  CHEM: "bg-pink-100 text-pink-700 border-pink-200",
  BIO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMP: "bg-indigo-100 text-indigo-700 border-indigo-200",
  default: "bg-bg-app text-text-primary border-border-subtle",
};

function getSubjectColor(code?: string): string {
  if (!code) return SUBJECT_COLORS.default;
  const upperCode = code.toUpperCase();
  
  // Check for exact match
  if (SUBJECT_COLORS[upperCode]) return SUBJECT_COLORS[upperCode];
  
  // Check for prefix match
  for (const [key, value] of Object.entries(SUBJECT_COLORS)) {
    if (upperCode.startsWith(key)) return value;
  }
  
  return SUBJECT_COLORS.default;
}

interface SubjectBadgeProps {
  name: string;
  code?: string;
  className?: string;
  showCode?: boolean;
}

/**
 * SubjectBadge - Displays a subject name with color coding based on subject code
 * 
 * @example
 * <SubjectBadge name="Mathematics" code="MATH" />
 * <SubjectBadge name="Physics" code="PHY" showCode />
 */
export function SubjectBadge({
  name,
  code,
  className,
  showCode = false,
}: SubjectBadgeProps) {
  const colorClass = getSubjectColor(code);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
        "text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {showCode && code && (
        <span className="opacity-70">{code}</span>
      )}
      <span>{name}</span>
    </span>
  );
}

/**
 * EmptySubjectBadge - Placeholder when no subject is assigned
 */
export function EmptySubjectBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1",
        "text-xs text-text-muted italic",
        "border border-dashed border-border-subtle",
        className
      )}
    >
      No subject
    </span>
  );
}
