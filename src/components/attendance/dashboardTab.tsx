"use client";

import {
  Check,
  X,
  AlertCircle,
  ClipboardCheck,
  Users,
  CheckCheck,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAttendanceSummary } from "@/lib/api/attendance";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Badge,
} from "@/components/ui";

// =============================================================================
// Dashboard Tab
// =============================================================================

export function DashboardTab({
    onMarkAttendance,
  }: {
    onMarkAttendance: (batchId: string | null) => void;
  }) {
    const { data: summary, isLoading, error } = useAttendanceSummary();
  
    if (isLoading) {
      return <DashboardSkeleton />;
    }
  
    if (error) {
      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load attendance summary. Please try again.
            </p>
          </CardContent>
        </Card>
      );
    }
  
    if (!summary) {
      return (
        <Card>
          <EmptyState
            icon={LayoutDashboard}
            title="No data available"
            description="Attendance data will appear here once you start marking attendance"
          />
        </Card>
      );
    }
  
    const attendanceRate =
      summary.totalMarked > 0
        ? Math.round((summary.totalPresent / summary.totalMarked) * 100)
        : 0;
  
    const markedRate =
      summary.totalActiveStudents > 0
        ? Math.round((summary.totalMarked / summary.totalActiveStudents) * 100)
        : 0;
  
    console.log("summary", summary);
  
    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Attendance Rate Card */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">Attendance Rate</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {attendanceRate}%
                  </p>
                </div>
                <div className="relative h-16 w-16">
                  <svg className="h-16 w-16 -rotate-90 transform">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-bg-app"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${attendanceRate * 1.76} 176`}
                      className="text-success transition-all duration-500"
                    />
                  </svg>
                  <TrendingUp className="absolute inset-0 m-auto h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Present Count */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Present Today</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary.totalPresent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Absent Count */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <X className="h-6 w-6 text-error" />
                </div>
                <div>
                  <p className="text-sm text-text-muted">Absent Today</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {summary.totalAbsent}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Progress Card */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">Marking Progress</p>
                  <Badge variant={markedRate === 100 ? "success" : "warning"}>
                    {summary.batchesMarked}/
                    {summary.batchesMarked + summary.batchesPending} batches
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-app">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${markedRate}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  {summary.totalMarked} of {summary.totalActiveStudents} students
                  marked
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
  
        {/* Pending Batches */}
        {summary.pendingBatches?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pending Batches ({summary.pendingBatches?.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.pendingBatches?.map((batch) => (
                <div
                  key={batch.batchId}
                  className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-app p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                      <Users className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {batch.batchName}
                      </p>
                      <p className="text-sm text-text-muted">
                        {batch.studentCount} students
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onMarkAttendance(batch.batchId)}
                  >
                    Mark Now
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
  
        {/* Completed Batches */}
        {summary.batchSummaries?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCheck className="h-5 w-5 text-success" />
                Completed Batches ({summary.batchSummaries?.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.batchSummaries?.map((batch) => {
                  const rate =
                    batch.total > 0
                      ? Math.round((batch.present / batch.total) * 100)
                      : 0;
                  return (
                    <div
                      key={batch.batchId}
                      className="rounded-lg border border-border-subtle bg-bg-app p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-text-primary">
                          {batch.batchName}
                        </p>
                        <Badge
                          variant={
                            rate >= 80
                              ? "success"
                              : rate >= 60
                              ? "warning"
                              : "error"
                          }
                        >
                          {rate}%
                        </Badge>
                      </div>
                      <div className="mt-3 flex gap-4 text-sm">
                        <span className="text-success">
                          <Check className="mr-1 inline h-3.5 w-3.5" />
                          {batch.present}
                        </span>
                        <span className="text-error">
                          <X className="mr-1 inline h-3.5 w-3.5" />
                          {batch.absent}
                        </span>
                        <span className="text-text-muted">
                          Total: {batch.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
  
        {/* All Done State */}
        {summary.pendingBatches?.length === 0 &&
          summary.batchSummaries?.length === 0 && (
            <Card>
              <EmptyState
                icon={ClipboardCheck}
                title="No batches to show"
                description="Create batches and assign students to start tracking attendance"
              />
            </Card>
          )}
      </div>
    );
  }
  
  export function DashboardSkeleton() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="py-8">
            <Skeleton className="mx-auto h-32 w-full max-w-md" />
          </CardContent>
        </Card>
      </div>
    );
  }