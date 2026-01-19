"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import {
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  SkipForward,
  Loader2,
  AlertCircle,
  Activity,
  Timer,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  Link,
  ArrowLeft,
} from "lucide-react";
import {
  useJobs,
  useJobRuns,
  useJobRun,
  useJobStats,
  useTriggerJob,
  useRetryJobRun,
  type JobDefinition,
  type JobRun,
  type JobStatus,
  type JobRunFilters,
} from "@/lib/api/jobs";
import { useOrganization } from "@/lib/api";
import { usePermissions } from "@/lib/hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Jobs Dashboard Page
 *
 * Admin-only page for monitoring and managing scheduled jobs.
 * - View job definitions and their status
 * - See run history with pagination
 * - View statistics and success rates
 * - Trigger jobs manually
 * - Retry failed jobs
 */
export default function JobsDashboardPage() {
  const { can } = usePermissions();
  const { data: org, isLoading: orgLoading } = useOrganization();

  // Check permission
  if (!can("SETTINGS_MANAGE")) {
    redirect("/settings");
  }

  // Check if feature is enabled
  if (orgLoading) {
    return <JobsDashboardSkeleton />;
  }

  if (!org?.jobsDashboardEnabled) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold text-amber-800 mb-2">
              Jobs Dashboard Not Enabled
            </h2>
            <p className="text-amber-700 max-w-md">
              The Jobs Dashboard is not enabled for your organization. Contact
              support to enable this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/students">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <JobStatsSection />

      {/* Job Definitions */}
      <JobDefinitionsSection />

      {/* Run History */}
      <JobRunsSection />
    </div>
  );
}

/**
 * Job Stats Section
 */
function JobStatsSection() {
  const { data: stats, isLoading, error } = useJobStats({ days: 7 });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const statCards = [
    {
      label: "Total Runs (7d)",
      value: stats.overall.total,
      icon: Activity,
      color: "text-primary-600",
      bgColor: "bg-primary-50",
    },
    {
      label: "Success Rate",
      value: `${stats.overall.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Failed",
      value: stats.overall.failed,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      label: "Avg Duration",
      value: formatDuration(stats.overall.avgDurationMs),
      icon: Timer,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className={cn("p-3 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-text-muted">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Job Definitions Section
 */
function JobDefinitionsSection() {
  const { data: jobs, isLoading, error, refetch } = useJobs();
  const triggerJob = useTriggerJob();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-8">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">Failed to load job definitions.</p>
        </CardContent>
      </Card>
    );
  }

  const handleTrigger = async (jobName: string) => {
    try {
      await triggerJob.mutateAsync(jobName);
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-text-muted" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>
              Background jobs running on schedule
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs?.map((job) => (
            <div
              key={job.id}
              className={cn(
                "border rounded-lg transition-colors",
                expandedJob === job.id
                  ? "border-primary-200"
                  : "border-border-subtle"
              )}
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-app"
                onClick={() =>
                  setExpandedJob(expandedJob === job.id ? null : job.id)
                }
              >
                <div className="flex items-center gap-4">
                  <JobStatusIcon
                    status={job.lastStatus}
                    isRunning={job.isRunning}
                  />
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-text-muted">{job.schedule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {job.lastRunAt && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-text-muted">Last run</p>
                      <p className="text-sm">
                        {formatRelativeTime(job.lastRunAt)}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrigger(job.id);
                    }}
                    disabled={triggerJob.isPending || job.isRunning}
                  >
                    {triggerJob.isPending && triggerJob.variables === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  {expandedJob === job.id ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </div>
              </div>
              {expandedJob === job.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border-subtle bg-bg-app">
                  <p className="text-sm text-text-muted mb-3">
                    {job.description}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Schedule</p>
                      <p className="font-medium">{job.schedule}</p>
                    </div>
                    {job.cronExpression && (
                      <div>
                        <p className="text-text-muted">Cron</p>
                        <code className="text-xs bg-bg-card px-1 rounded">
                          {job.cronExpression}
                        </code>
                      </div>
                    )}
                    {job.lastStatus && (
                      <div>
                        <p className="text-text-muted">Last Status</p>
                        <StatusBadge status={job.lastStatus} />
                      </div>
                    )}
                    {job.lastDurationMs && (
                      <div>
                        <p className="text-text-muted">Last Duration</p>
                        <p className="font-medium">
                          {formatDuration(job.lastDurationMs)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Job Runs Section
 */
function JobRunsSection() {
  const [filters, setFilters] = useState<JobRunFilters>({
    page: 1,
    limit: 10,
  });
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: runsData, isLoading, error, refetch } = useJobRuns(filters);
  const retryRun = useRetryJobRun();

  const handleRetry = async (runId: string) => {
    try {
      await retryRun.mutateAsync(runId);
      refetch();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-text-muted" />
                Run History
              </CardTitle>
              <CardDescription>
                Recent job executions and their results
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={filters.jobName || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    jobName: value === "all" ? undefined : value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="event-processor">
                    Event Processor
                  </SelectItem>
                  <SelectItem value="fee-overdue-check">
                    Fee Overdue Check
                  </SelectItem>
                  <SelectItem value="fee-reminder">Fee Reminder</SelectItem>
                  <SelectItem value="birthday-notifications">
                    Birthday Notifications
                  </SelectItem>
                  <SelectItem value="cleanup-job-runs">
                    Cleanup Job Runs
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? undefined : (value as JobStatus),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-error">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to load job runs</span>
            </div>
          ) : runsData?.data.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No job runs found</p>
              <p className="text-sm">Runs will appear here as jobs execute</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border-subtle">
                      <th className="pb-3 font-medium">Job</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Started</th>
                      <th className="pb-3 font-medium">Duration</th>
                      <th className="pb-3 font-medium">Events</th>
                      <th className="pb-3 font-medium">Records</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {runsData?.data.map((run) => (
                      <tr
                        key={run.id}
                        className="hover:bg-bg-app cursor-pointer"
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <td className="py-3">
                          <p className="font-medium text-sm">
                            {formatJobName(run.jobName)}
                          </p>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="py-3 text-sm text-text-muted">
                          {formatRelativeTime(run.startedAt)}
                        </td>
                        <td className="py-3 text-sm">
                          {run.durationMs
                            ? formatDuration(run.durationMs)
                            : "—"}
                        </td>
                        <td className="py-3 text-sm">
                          {run.eventsEmitted || "—"}
                        </td>
                        <td className="py-3 text-sm">
                          {run.recordsProcessed || "—"}
                        </td>
                        <td className="py-3">
                          {run.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetry(run.id);
                              }}
                              disabled={retryRun.isPending}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {runsData && runsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                  <p className="text-sm text-text-muted">
                    Showing{" "}
                    {(runsData.pagination.page - 1) *
                      runsData.pagination.limit +
                      1}{" "}
                    -{" "}
                    {Math.min(
                      runsData.pagination.page * runsData.pagination.limit,
                      runsData.pagination.total
                    )}{" "}
                    of {runsData.pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={runsData.pagination.page === 1}
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page! - 1 })
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={
                        runsData.pagination.page ===
                        runsData.pagination.totalPages
                      }
                      onClick={() =>
                        setFilters({
                          ...filters,
                          page: (filters.page || 1) + 1,
                        })
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Job Run Detail Dialog */}
      <JobRunDetailDialog
        runId={selectedRunId}
        onClose={() => setSelectedRunId(null)}
        onRetry={handleRetry}
      />
    </>
  );
}

/**
 * Job Run Detail Dialog
 */
function JobRunDetailDialog({
  runId,
  onClose,
  onRetry,
}: {
  runId: string | null;
  onClose: () => void;
  onRetry: (id: string) => void;
}) {
  const { data: run, isLoading } = useJobRun(runId || "");

  if (!runId) return null;

  return (
    <Dialog open={!!runId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Run Details
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Detailed information about this job execution
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : run ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted">Job</p>
                <p className="font-medium">{formatJobName(run.jobName)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Status</p>
                <StatusBadge status={run.status} />
              </div>
              <div>
                <p className="text-xs text-text-muted">Started</p>
                <p className="text-sm">
                  {new Date(run.startedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Completed</p>
                <p className="text-sm">
                  {run.completedAt
                    ? new Date(run.completedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Duration</p>
                <p className="text-sm font-medium">
                  {run.durationMs ? formatDuration(run.durationMs) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Events Emitted</p>
                <p className="text-sm font-medium">{run.eventsEmitted}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Records Processed</p>
                <p className="text-sm font-medium">{run.recordsProcessed}</p>
              </div>
            </div>

            {run.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 font-medium mb-1">Error</p>
                <p className="text-sm text-red-700">{run.errorMessage}</p>
              </div>
            )}

            {run.metadata && Object.keys(run.metadata).length > 0 && (
              <div className="p-3 bg-bg-app rounded-lg">
                <p className="text-xs text-text-muted font-medium mb-2">
                  Metadata
                </p>
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(run.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {run?.status === "failed" && (
            <Button onClick={() => onRetry(run.id)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Job
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Job Status Icon
 */
function JobStatusIcon({
  status,
  isRunning,
}: {
  status: JobStatus | null;
  isRunning: boolean;
}) {
  if (isRunning) {
    return (
      <div className="p-2 rounded-lg bg-blue-50">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      </div>
    );
  }

  switch (status) {
    case "completed":
      return (
        <div className="p-2 rounded-lg bg-emerald-50">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
      );
    case "failed":
      return (
        <div className="p-2 rounded-lg bg-red-50">
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
      );
    case "skipped":
      return (
        <div className="p-2 rounded-lg bg-amber-50">
          <SkipForward className="h-5 w-5 text-amber-600" />
        </div>
      );
    default:
      return (
        <div className="p-2 rounded-lg bg-bg-app">
          <Clock className="h-5 w-5 text-text-muted" />
        </div>
      );
  }
}

/**
 * Status Badge
 */
function StatusBadge({ status }: { status: JobStatus }) {
  const variants: Record<JobStatus, "success" | "error" | "warning" | "info"> =
    {
      completed: "success",
      failed: "error",
      skipped: "warning",
      running: "info",
    };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {status}
    </Badge>
  );
}

/**
 * Loading Skeleton
 */
function JobsDashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-6xl">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}

/**
 * Utility Functions
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatJobName(jobName: string): string {
  return jobName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
