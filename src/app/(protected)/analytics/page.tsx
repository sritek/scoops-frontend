"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  Users,
  GraduationCap,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  useBranchComparison,
  useBranchPerformance,
  useOrgStats,
} from "@/lib/api/analytics";
import { usePermissions } from "@/lib/hooks";
import {
  Card,
  CardContent,
  Badge,
  Spinner,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { AccessDenied } from "@/components/ui/access-denied";
import type { BranchMetrics } from "@/types/analytics";

/**
 * Analytics Dashboard Page
 */
export default function AnalyticsPage() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const { can } = usePermissions();

  const canViewAnalytics = can("SETTINGS_MANAGE");

  const { data: comparison, isLoading: comparisonLoading } = useBranchComparison();
  const { data: orgStats, isLoading: orgStatsLoading } = useOrgStats();
  const { data: branchPerformance, isLoading: performanceLoading } =
    useBranchPerformance(selectedBranchId);

  if (!canViewAnalytics) {
    return <AccessDenied message="You don't have permission to view analytics." />;
  }

  const isLoading = comparisonLoading || orgStatsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const branches = comparison?.branches ?? [];
  const totals = comparison?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted">
          Cross-branch performance and insights
        </p>
      </div>

      {/* Organization Overview */}
      {orgStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            icon={Building2}
            label="Branches"
            value={orgStats.totalBranches}
          />
          <StatCard
            icon={Users}
            label="Total Staff"
            value={orgStats.totalStaff}
          />
          <StatCard
            icon={GraduationCap}
            label="Total Students"
            value={orgStats.totalStudents}
          />
          <StatCard
            icon={Clock}
            label="Pending Fees"
            value={orgStats.pendingFees}
            variant="warning"
          />
          <StatCard
            icon={IndianRupee}
            label="Monthly Collection"
            value={formatCurrency(orgStats.monthlyCollection)}
            variant="success"
          />
        </div>
      )}

      {/* Totals Summary */}
      {totals && (
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30">
          <CardContent className="p-6">
            <h2 className="font-medium mb-4">Organization Summary (30 Days)</h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-sm text-text-muted">Avg Attendance Rate</p>
                <p className="text-2xl font-bold text-primary-600">
                  {totals.avgAttendanceRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Avg Fee Collection</p>
                <p className="text-2xl font-bold text-primary-600">
                  {totals.avgFeeCollectionRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Collected</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totals.totalFeesCollected)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(totals.totalFeesPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branch Comparison */}
      <div>
        <h2 className="text-lg font-medium mb-4">Branch Comparison</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              isSelected={selectedBranchId === branch.id}
              onSelect={() =>
                setSelectedBranchId(
                  selectedBranchId === branch.id ? "" : branch.id
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Branch Details */}
      {selectedBranchId && (
        <div>
          <h2 className="text-lg font-medium mb-4">
            Branch Details: {branchPerformance?.branchName || "Loading..."}
          </h2>
          {performanceLoading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </CardContent>
            </Card>
          ) : branchPerformance ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Metrics */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Performance Metrics</h3>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Total Students</dt>
                      <dd className="font-medium">
                        {branchPerformance.metrics.totalStudents}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Total Batches</dt>
                      <dd className="font-medium">
                        {branchPerformance.metrics.totalBatches}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Avg Batch Size</dt>
                      <dd className="font-medium">
                        {branchPerformance.metrics.avgBatchSize}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Attendance Rate</dt>
                      <dd>
                        <RateBadge rate={branchPerformance.metrics.attendanceRate} />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Fee Collection</dt>
                      <dd>
                        <RateBadge rate={branchPerformance.metrics.feeCollectionRate} />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Open Complaints</dt>
                      <dd className="font-medium">
                        {branchPerformance.metrics.openComplaints}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Batches */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Batches</h3>
                  {branchPerformance.batches.length === 0 ? (
                    <p className="text-text-muted text-sm">No active batches</p>
                  ) : (
                    <div className="space-y-3">
                      {branchPerformance.batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center justify-between rounded-lg bg-surface-secondary p-3"
                        >
                          <span className="font-medium">{batch.name}</span>
                          <Badge variant="default">
                            {batch.studentCount} students
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Trend */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Attendance Trend (14 Days)</h3>
                  {branchPerformance.trends.attendance.length === 0 ? (
                    <p className="text-text-muted text-sm">No data available</p>
                  ) : (
                    <div className="space-y-2">
                      {branchPerformance.trends.attendance.map((point) => (
                        <div key={point.date} className="flex items-center gap-3">
                          <span className="text-xs text-text-muted w-20">
                            {formatShortDate(point.date)}
                          </span>
                          <div className="flex-1 h-4 bg-surface-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (point.rate ?? 0) >= 80
                                  ? "bg-success"
                                  : (point.rate ?? 0) >= 60
                                  ? "bg-warning"
                                  : "bg-error"
                              }`}
                              style={{ width: `${point.rate ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">
                            {point.rate ?? 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fee Collection Trend */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Fee Collection (14 Days)</h3>
                  {branchPerformance.trends.feeCollection.length === 0 ? (
                    <p className="text-text-muted text-sm">No data available</p>
                  ) : (
                    <div className="space-y-2">
                      {branchPerformance.trends.feeCollection.map((point) => (
                        <div
                          key={point.date}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-text-muted">
                            {formatShortDate(point.date)}
                          </span>
                          <span className="text-sm font-medium text-success">
                            {formatCurrency(point.amount ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Stat Card
 */
function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning";
}) {
  const variantStyles = {
    default: "text-text-primary",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-surface-secondary p-2 text-text-muted">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-text-muted">{label}</p>
          <p className={`text-lg font-semibold ${variantStyles[variant]}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Branch Card
 */
function BranchCard({
  branch,
  isSelected,
  onSelect,
}: {
  branch: BranchMetrics;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary-500" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium">{branch.name}</h3>
            <p className="text-xs text-text-muted">
              {branch.studentCount} students • {branch.staffCount} staff
            </p>
          </div>
          <Building2 className="h-5 w-5 text-text-muted" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Attendance</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {branch.attendanceRate}%
              </span>
              {branch.attendanceRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-warning" />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted">Fee Collection</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {branch.feeCollectionRate}%
              </span>
              {branch.feeCollectionRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-warning" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Collected</span>
            <span className="font-medium text-success">
              {formatCurrency(branch.totalFeesCollected)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-muted">Pending</span>
            <span className="font-medium text-warning">
              {formatCurrency(branch.totalFeesPending)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Rate Badge
 */
function RateBadge({ rate }: { rate: number }) {
  const variant = rate >= 80 ? "success" : rate >= 60 ? "warning" : "error";
  const icon = rate >= 80 ? CheckCircle : rate >= 60 ? Clock : AlertCircle;
  const Icon = icon;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {rate}%
    </Badge>
  );
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format short date
 */
function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}
