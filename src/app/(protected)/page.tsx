"use client";

import {
  UserCheck,
  UserX,
  ClipboardList,
  Clock,
  IndianRupee,
  AlertCircle,
  Wallet,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useDashboard } from "@/lib/api/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  StatCardSkeleton,
} from "@/components/ui";

/**
 * Format currency in Indian Rupees
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Dashboard Page (Protected)
 *
 * Shows key metrics:
 * - Today's attendance summary
 * - Pending fees overview
 * - Fees collected today
 *
 * Requires DASHBOARD_VIEW permission (admin only)
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted">
          Welcome back, {user?.name || "User"}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attendance Section */}
      <section aria-labelledby="attendance-heading">
        <h2
          id="attendance-heading"
          className="text-lg font-medium text-text-primary mb-4"
        >
          Today&apos;s Attendance
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Present"
              value={data.attendance.totalPresent}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              label="Absent"
              value={data.attendance.totalAbsent}
              icon={UserX}
              variant="error"
            />
            <StatCard
              label="Marked"
              value={`${data.attendance.totalMarked}/${data.attendance.totalActiveStudents}`}
              icon={ClipboardList}
              variant="default"
            />
            <StatCard
              label="Batches Pending"
              value={data.attendance.batchesPending}
              subValue={`${data.attendance.batchesMarked} marked`}
              icon={Clock}
              variant={
                data.attendance.batchesPending > 0 ? "warning" : "default"
              }
            />
          </div>
        ) : null}
      </section>

      {/* Fees Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Fees */}
        <section aria-labelledby="pending-fees-heading">
          <h2
            id="pending-fees-heading"
            className="text-lg font-medium text-text-primary mb-4"
          >
            Pending Fees
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : data ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Total Pending"
                value={formatCurrency(data.pendingFees.totalPendingAmount)}
                subValue={`${data.pendingFees.totalCount} fees`}
                icon={IndianRupee}
                variant="warning"
              />
              <StatCard
                label="Overdue"
                value={formatCurrency(data.pendingFees.overdueAmount)}
                subValue={`${data.pendingFees.overdueCount} fees`}
                icon={AlertCircle}
                variant={
                  data.pendingFees.overdueCount > 0 ? "error" : "default"
                }
              />
            </div>
          ) : null}
        </section>

        {/* Fees Collected Today */}
        <section aria-labelledby="collected-fees-heading">
          <h2
            id="collected-fees-heading"
            className="text-lg font-medium text-text-primary mb-4"
          >
            Collected Today
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : data ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Total Collected"
                value={formatCurrency(data.feesCollected.totalAmount)}
                icon={Wallet}
                variant="success"
              />
              <StatCard
                label="Payments"
                value={data.feesCollected.totalCount}
                subValue={getPaymentModeSummary(data.feesCollected.byMode)}
                icon={Receipt}
                variant="default"
              />
            </div>
          ) : null}
        </section>
      </div>

      {/* Pending Batches List (if any) */}
      {data && data.attendance.batchesPending > 0 && (
        <section aria-labelledby="pending-batches-heading">
          <Card>
            <CardHeader>
              <CardTitle id="pending-batches-heading" className="text-base">
                Batches Without Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul
                className="divide-y divide-border-subtle"
                aria-label="Batches pending attendance"
              >
                {data.attendance.pendingBatches.map((batch) => (
                  <li
                    key={batch.batchId}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-text-primary">
                      {batch.batchName}
                    </span>
                    <span className="text-sm text-text-muted">
                      {batch.studentCount} students
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

/**
 * Generate payment mode summary string
 */
function getPaymentModeSummary(byMode: {
  cash: { count: number };
  upi: { count: number };
  bank: { count: number };
}): string {
  const parts: string[] = [];
  if (byMode.cash.count > 0) parts.push(`${byMode.cash.count} cash`);
  if (byMode.upi.count > 0) parts.push(`${byMode.upi.count} UPI`);
  if (byMode.bank.count > 0) parts.push(`${byMode.bank.count} bank`);
  return parts.join(", ") || "No payments";
}
