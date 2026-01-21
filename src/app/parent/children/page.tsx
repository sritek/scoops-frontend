"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight, GraduationCap, Calendar, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, Skeleton, Avatar, Badge } from "@/components/ui";
import { getParentChildren, type ChildDetails } from "@/lib/api/parent";

/**
 * Child card with details
 */
function ChildCard({ child }: { child: ChildDetails }) {
  const attendanceColor =
    child.attendanceSummary.attendancePercentage === null
      ? "text-text-muted"
      : child.attendanceSummary.attendancePercentage >= 75
      ? "text-green-600"
      : child.attendanceSummary.attendancePercentage >= 50
      ? "text-yellow-600"
      : "text-red-600";

  console.log("child attendance summary", child);

  return (
    <Link href={`/parent/children/${child.id}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={child.photoUrl ?? undefined}
              fallback={child.firstName.charAt(0)}
              alt={`${child.firstName} ${child.lastName}`}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-text-primary">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-sm text-text-muted">
                    {child.batchName || "No batch assigned"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0" />
              </div>

              <div className="mt-3 flex items-center gap-3 text-sm">
                {child.isPrimaryContact && <Badge>Primary Contact</Badge>}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-muted" />
                  <span className="text-text-muted">Relation:</span>
                  <span className="capitalize">{child.relation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-text-muted" />
                  <span className="text-text-muted">Attendance:</span>
                  <span className={cn("font-medium", attendanceColor)}>
                    {child.attendanceSummary.attendancePercentage !== null
                      ? `${child.attendanceSummary.attendancePercentage}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton
 */
function ChildrenSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}

/**
 * Children List Page
 *
 * Shows all children linked to the parent account
 */
export default function ParentChildrenPage() {
  const {
    data: children,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: getParentChildren,
  });

  if (isLoading) {
    return <ChildrenSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load children</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary-600" />
        <h1 className="text-xl font-semibold text-text-primary">My Children</h1>
      </div>

      {children && children.length > 0 ? (
        <div className="space-y-3">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted">
              No children linked to your account
            </p>
            <p className="text-sm text-text-muted mt-1">
              Contact the school administration for assistance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
