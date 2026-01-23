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
  BookOpen,
  AlertTriangle,
  Cake,
  Users,
  TrendingUp,
  ExternalLink,
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
  Badge,
  ChartSkeleton,
  ListSkeleton,
  Skeleton,
} from "@/components/ui";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import type { ActionItem } from "@/types/dashboard";

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
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get priority badge variant
 */
function getPriorityVariant(priority: ActionItem["priority"]): "default" | "error" | "success" | "warning" {
  switch (priority) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "default";
  }
}

/**
 * Get action item icon
 */
function getActionItemIcon(type: ActionItem["type"]) {
  switch (type) {
    case "attendance_pending":
      return Clock;
    case "fees_overdue":
      return AlertTriangle;
    case "birthday":
      return Cake;
    case "staff_unmarked":
      return Users;
    default:
      return AlertCircle;
  }
}

/**
 * Dashboard Page (Protected)
 *
 * Shows role-specific metrics:
 * - Admin/Staff: Full dashboard (attendance + fees + action items + trends)
 * - Teacher: Their batch attendance + their batch fees + birthdays
 * - Accounts: Fees only + fee collection trends
 *
 * Requires DASHBOARD_VIEW permission
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  // Check what sections to show based on returned data
  const showAttendance = data?.attendance !== null;
  const showFeesCollected = data?.feesCollected !== null;
  const isTeacher = user?.role?.toLowerCase() === "teacher";
  const isAccounts = user?.role?.toLowerCase() === "accounts";
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted">
          Welcome back, {user?.name || "User"}
          {isTeacher && data?.teacherBatch && ` - ${data.teacherBatch.name}`}
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

      {/* Action Items - High Priority Todos */}
      {data?.actionItems && data.actionItems.length > 0 && (
        <section aria-labelledby="action-items-heading">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle id="action-items-heading" className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.actionItems.map((item, index) => {
                  const Icon = getActionItemIcon(item.type);
                  return (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-2 rounded-lg bg-bg-card"
                    >
                      <Icon className="h-5 w-5 mt-0.5 text-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{item.title}</span>
                          <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                            {item.priority}
                          </Badge>
                          {item.count && (
                            <span className="text-xs text-text-muted">({item.count})</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                      </div>
                      {item.actionUrl && (
                        <Link
                          href={item.actionUrl}
                          className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Attendance Section - Hidden for accounts role */}
      {(isLoading || showAttendance) && (
        <section aria-labelledby="attendance-heading">
          <h2
            id="attendance-heading"
            className="text-lg font-medium text-text-primary mb-4"
          >
            {isTeacher ? "Your Batch Attendance" : "Today's Attendance"}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : data?.attendance ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Present"
                value={data.attendance.totalPresent ?? 0}
                icon={UserCheck}
                variant="success"
              />
              <StatCard
                label="Absent"
                value={data.attendance.totalAbsent ?? 0}
                icon={UserX}
                variant="error"
              />
              <StatCard
                label="Marked"
                value={`${data.attendance.totalMarked ?? 0}/${data.attendance.totalActiveStudents ?? 0}`}
                icon={ClipboardList}
                variant="default"
              />
              <StatCard
                label="Batches Pending"
                value={data.attendance.batchesPending ?? 0}
                subValue={`${data.attendance.batchesMarked ?? 0} marked`}
                icon={Clock}
                variant={
                  (data.attendance.batchesPending ?? 0) > 0 ? "warning" : "default"
                }
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Staff Attendance (Admin only) */}
      {isAdmin && (isLoading || data?.staffAttendance) && (
        <section aria-labelledby="staff-attendance-heading">
          <h2
            id="staff-attendance-heading"
            className="text-lg font-medium text-text-primary mb-4"
          >
            Staff Attendance
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : data?.staffAttendance ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                label="Present"
                value={data.staffAttendance.present ?? 0}
                icon={UserCheck}
                variant="success"
              />
              <StatCard
                label="On Leave"
                value={(data.staffAttendance.leave ?? 0) + (data.staffAttendance.halfDay ?? 0)}
                icon={Clock}
                variant="default"
              />
              <StatCard
                label="Not Marked"
                value={data.staffAttendance.notMarked ?? 0}
                icon={AlertCircle}
                variant={(data.staffAttendance.notMarked ?? 0) > 0 ? "warning" : "default"}
              />
              <StatCard
                label="Total Staff"
                value={data.staffAttendance.totalStaff ?? 0}
                icon={Users}
                variant="default"
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Fees Section */}
      <div className={`grid gap-6 ${showFeesCollected ? "md:grid-cols-2" : ""}`}>
        {/* Pending Fees */}
        <section aria-labelledby="pending-fees-heading">
          <h2
            id="pending-fees-heading"
            className="text-lg font-medium text-text-primary mb-4"
          >
            {isTeacher ? "Your Batch Pending Fees" : "Pending Fees"}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : data?.pendingFees ? (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Total Pending"
                value={formatCurrency(data.pendingFees.totalPendingAmount ?? 0)}
                subValue={`${data.pendingFees.totalCount ?? 0} fees`}
                icon={IndianRupee}
                variant="warning"
              />
              <StatCard
                label="Overdue"
                value={formatCurrency(data.pendingFees.overdueAmount ?? 0)}
                subValue={`${data.pendingFees.overdueCount ?? 0} fees`}
                icon={AlertCircle}
                variant={
                  (data.pendingFees.overdueCount ?? 0) > 0 ? "error" : "default"
                }
              />
            </div>
          ) : null}
        </section>

        {/* Fees Collected Today - Hidden for teacher role */}
        {(isLoading || showFeesCollected) && (
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
            ) : data?.feesCollected ? (
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Collected"
                  value={formatCurrency(data.feesCollected.totalAmount ?? 0)}
                  icon={Wallet}
                  variant="success"
                />
                <StatCard
                  label="Payments"
                  value={data.feesCollected.totalCount ?? 0}
                  subValue={getPaymentModeSummary(data.feesCollected.byMode)}
                  icon={Receipt}
                  variant="default"
                />
              </div>
            ) : null}
          </section>
        )}
      </div>

      {/* Trends Section */}
      {(isLoading || data?.trends) && (
        <div className="grid gap-6 md:grid-cols-2">
          {isLoading ? (
            <>
              <ChartSkeleton height={200} titleWidth="w-48" />
              <ChartSkeleton height={200} titleWidth="w-44" />
            </>
          ) : (
            <>
              {/* Attendance Trend */}
              {data?.trends?.attendance && data.trends.attendance.length > 0 && (
                <section aria-labelledby="attendance-trend-heading">
                  <Card>
                    <CardHeader>
                      <CardTitle id="attendance-trend-heading" className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Attendance Trend (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.trends.attendance}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(v) => formatDate(v)}
                              className="text-xs"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip
                              labelFormatter={(v) => formatDate(String(v))}
                              formatter={(value, name) => [
                                name === "percentage" ? `${value}%` : value,
                                name === "percentage" ? "Attendance" : String(name),
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="percentage"
                              stroke="#22c55e"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Fee Collection Trend */}
              {data?.trends?.feeCollection && data.trends.feeCollection.length > 0 && (
                <section aria-labelledby="fee-trend-heading">
                  <Card>
                    <CardHeader>
                      <CardTitle id="fee-trend-heading" className="text-base flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Fee Collection (Last 7 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.trends.feeCollection}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border-subtle" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(v) => formatDate(v)}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                            <Tooltip
                              labelFormatter={(v) => formatDate(String(v))}
                              formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Upcoming Birthdays */}
      {(isLoading || (data?.upcomingBirthdays && data.upcomingBirthdays.length > 0)) && (
        <section aria-labelledby="birthdays-heading">
          {isLoading ? (
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : data?.upcomingBirthdays && data.upcomingBirthdays.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle id="birthdays-heading" className="text-base flex items-center gap-2">
                  <Cake className="h-4 w-4" />
                  Upcoming Birthdays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border-subtle">
                  {data.upcomingBirthdays.slice(0, 5).map((birthday) => (
                    <li
                      key={birthday.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <span className="text-sm font-medium text-text-primary">
                          {birthday.name}
                        </span>
                        {birthday.batchName && (
                          <span className="text-xs text-text-muted ml-2">
                            ({birthday.batchName})
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={birthday.daysUntil === 0 ? "success" : "default"}
                      >
                        {birthday.daysUntil === 0
                          ? "Today!"
                          : birthday.daysUntil === 1
                          ? "Tomorrow"
                          : `In ${birthday.daysUntil} days`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {/* Pending Batches List (if any) - Only shown if attendance data is available */}
      {data?.attendance && data.attendance.batchesPending > 0 && (
        <section aria-labelledby="pending-batches-heading">
          <Card>
            <CardHeader>
              <CardTitle id="pending-batches-heading" className="text-base">
                {isTeacher ? "Your Batch Needs Attendance" : "Batches Without Attendance"}
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

      {/* Teacher-specific: Link to their batch */}
      {isTeacher && data?.attendance && (
        <section aria-labelledby="quick-actions-heading">
          <Card>
            <CardHeader>
              <CardTitle id="quick-actions-heading" className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">
                You can mark attendance for your batch from the{" "}
                <Link href="/attendance" className="text-primary-600 hover:underline">
                  Attendance page
                </Link>
                .
              </p>
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
function getPaymentModeSummary(byMode?: {
  cash?: { count: number };
  upi?: { count: number };
  bank?: { count: number };
}): string {
  if (!byMode) return "No payments";

  const parts: string[] = [];
  if (byMode.cash?.count && byMode.cash.count > 0)
    parts.push(`${byMode.cash.count} cash`);
  if (byMode.upi?.count && byMode.upi.count > 0)
    parts.push(`${byMode.upi.count} UPI`);
  if (byMode.bank?.count && byMode.bank.count > 0)
    parts.push(`${byMode.bank.count} bank`);
  return parts.join(", ") || "No payments";
}
