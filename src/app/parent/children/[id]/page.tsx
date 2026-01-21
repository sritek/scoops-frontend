"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  IdCard,
  ChevronRight,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  CalendarDays,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Shield,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Avatar,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
} from "@/components/ui";
import {
  getChildDetails,
  getChildAttendance,
  getChildFees,
  getChildEmergencyContacts,
  updateChildEmergencyContacts,
  type ChildFees,
  type EmergencyContact,
} from "@/lib/api/parent";
import { toast } from "sonner";

/**
 * Overview Tab Content
 */
function OverviewTab({ studentId }: { studentId: string }) {
  const {
    data: child,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error || !child) {
    return <p className="text-error py-4">Failed to load child information</p>;
  }

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-muted">Full Name</p>
              <p className="font-medium">
                {child.firstName} {child.lastName}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Batch</p>
              <p className="font-medium">{child.batchName || "—"}</p>
            </div>
            <div>
              <p className="text-text-muted">Date of Birth</p>
              <p className="font-medium">
                {child.dateOfBirth
                  ? new Date(child.dateOfBirth).toLocaleDateString("en-IN")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Your Relation</p>
              <p className="font-medium capitalize">{child.relation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {child.isPrimaryContact && (
              <Badge variant="default">Primary Contact</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance (Last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {child.attendanceSummary?.presentDays ?? 0}
              </p>
              <p className="text-xs text-text-muted">Present</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {child.attendanceSummary?.totalDays ?? 0}
              </p>
              <p className="text-xs text-text-muted">Total Days</p>
            </div>
            <div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  !!child.attendanceSummary?.attendancePercentage
                    ? "text-text-muted"
                    : !!child.attendanceSummary?.attendancePercentage &&
                      child.attendanceSummary?.attendancePercentage >= 75
                    ? "text-green-600"
                    : !!child.attendanceSummary?.attendancePercentage &&
                      child.attendanceSummary?.attendancePercentage >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              >
                {!!child.attendanceSummary?.attendancePercentage
                  ? `${child.attendanceSummary?.attendancePercentage.toFixed(
                      2
                    )}%`
                  : "—"}
              </p>
              <p className="text-xs text-text-muted">Percentage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Link
            href={`/parent/children/${studentId}/teachers`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <GraduationCap className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-sm">View Teachers</p>
                <p className="text-xs text-text-muted">
                  Class teacher & subject teachers
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href={`/parent/children/${studentId}/academics`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">View Academics</p>
                <p className="text-xs text-text-muted">
                  Exam results & report card
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href={`/parent/children/${studentId}/homework`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-sm">View Homework</p>
                <p className="text-xs text-text-muted">
                  Assignments & submissions
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href={`/parent/children/${studentId}/id-card`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors border-b border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IdCard className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Digital ID Card</p>
                <p className="text-xs text-text-muted">
                  View & download student ID
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href={`/parent/children/${studentId}/leave`}
            className="flex items-center justify-between px-4 py-3 hover:bg-bg-app transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CalendarDays className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Apply Leave</p>
                <p className="text-xs text-text-muted">
                  Submit leave application
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Attendance Tab Content
 */
function AttendanceTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "attendance"],
    queryFn: () => getChildAttendance(studentId, { limit: 30 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-error py-4">Failed to load attendance</p>;
  }

  const statusIcon = {
    PRESENT: <CheckCircle className="h-4 w-4 text-green-600" />,
    ABSENT: <XCircle className="h-4 w-4 text-red-600" />,
    LATE: <Clock className="h-4 w-4 text-yellow-600" />,
    EXCUSED: <CheckCircle className="h-4 w-4 text-blue-600" />,
  };

  const statusColor = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-yellow-100 text-yellow-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <p className="text-lg font-bold text-green-600">
                {data?.summary.presentDays ?? 0}
              </p>
              <p className="text-xs text-text-muted">Present</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">
                {data?.summary.absentDays ?? 0}
              </p>
              <p className="text-xs text-text-muted">Absent</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-600">
                {data?.summary.lateDays ?? 0}
              </p>
              <p className="text-xs text-text-muted">Late</p>
            </div>
            <div>
              <p
                className={cn(
                  "text-lg font-bold",
                  !!data?.summary?.attendancePercentage &&
                    data?.summary?.attendancePercentage >= 75
                    ? "text-green-600"
                    : "text-text-primary"
                )}
              >
                {!!data?.summary?.attendancePercentage
                  ? `${data?.summary?.attendancePercentage}%`
                  : "—"}
              </p>
              <p className="text-xs text-text-muted">Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data?.records && data.records.length > 0 ? (
            <div className="divide-y divide-border-subtle">
              {data.records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon[record.status as keyof typeof statusIcon] || (
                      <CheckCircle className="h-4 w-4 text-text-muted" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(record.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-text-muted">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs",
                      statusColor[record.status as keyof typeof statusColor] ||
                        "bg-gray-100 text-gray-700"
                    )}
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-text-muted">
              No attendance records found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Fees Tab Content - Enhanced with breakdown and timeline
 */
function FeesTab({ studentId }: { studentId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "fees"],
    queryFn: () => getChildFees(studentId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return <p className="text-error py-4">Failed to load fee information</p>;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const installmentStatusColor: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    partial: "bg-blue-100 text-blue-700",
    overdue: "bg-red-100 text-red-700",
    upcoming: "bg-gray-100 text-gray-700",
  };

  // Calculate progress percentage
  const progressPercent = data?.summary.totalFee
    ? Math.round((data.summary.totalPaid / data.summary.totalFee) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Fee Summary with Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Fee Summary
            </CardTitle>
            {data?.feeStructure?.sessionName && (
              <Badge variant="default" className="text-xs">
                {data.feeStructure.sessionName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">Payment Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-bg-app rounded-lg">
              <p className="text-xs text-text-muted">Total Fee</p>
              <p className="text-lg font-bold">
                {formatCurrency(data?.summary.totalFee ?? 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600">Paid</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(data?.summary.totalPaid ?? 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-600">Pending</p>
              <p className="text-lg font-bold text-yellow-700">
                {formatCurrency(data?.summary.totalPending ?? 0)}
              </p>
            </div>
            {data?.summary.scholarshipAmount &&
              data.summary.scholarshipAmount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600">Scholarship</p>
                  <p className="text-lg font-bold text-blue-700">
                    -{formatCurrency(data.summary.scholarshipAmount)}
                  </p>
                </div>
              )}
          </div>

          {/* Next Due Alert */}
          {data?.summary.upcomingDueDate && data.summary.upcomingAmount && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Next Payment Due
                  </p>
                  <p className="text-xs text-amber-600">
                    {new Date(data.summary.upcomingDueDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <p className="text-lg font-bold text-amber-700">
                  {formatCurrency(data.summary.upcomingAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Overdue Warning */}
          {data?.summary.overdueCount && data.summary.overdueCount > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">
                {data.summary.overdueCount} installment
                {data.summary.overdueCount > 1 ? "s" : ""} overdue
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      {data?.lineItems && data.lineItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border-subtle">
              {data.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.componentName}
                    </p>
                    {item.description && (
                      <p className="text-xs text-text-muted truncate">
                        {item.description}
                      </p>
                    )}
                    {item.waived && (
                      <Badge variant="default" className="text-xs mt-1">
                        Waived
                        {item.waiverReason ? `: ${item.waiverReason}` : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {item.originalAmount !== item.adjustedAmount ? (
                      <>
                        <p className="text-xs text-text-muted line-through">
                          {formatCurrency(item.originalAmount)}
                        </p>
                        <p className="font-medium text-sm">
                          {formatCurrency(item.adjustedAmount)}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-sm">
                        {formatCurrency(item.adjustedAmount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {/* Total Row */}
              <div className="px-4 py-3 bg-bg-app flex items-center justify-between">
                <p className="font-semibold text-sm">Gross Total</p>
                <p className="font-bold">
                  {formatCurrency(data.summary.grossAmount)}
                </p>
              </div>
              {data.summary.scholarshipAmount > 0 && (
                <div className="px-4 py-2 bg-bg-app flex items-center justify-between text-green-600">
                  <p className="text-sm">Less: Scholarship</p>
                  <p className="font-medium">
                    -{formatCurrency(data.summary.scholarshipAmount)}
                  </p>
                </div>
              )}
              <div className="px-4 py-3 bg-primary-50 flex items-center justify-between">
                <p className="font-semibold">Net Payable</p>
                <p className="font-bold text-primary-700">
                  {formatCurrency(data.summary.totalFee)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scholarships */}
      {data?.scholarships && data.scholarships.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scholarships Applied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.scholarships.map((scholarship) => (
              <div
                key={scholarship.id}
                className="flex items-center justify-between p-3 bg-bg-app rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{scholarship.name}</p>
                  <p className="text-xs text-text-muted">
                    {scholarship.discountType === "percentage"
                      ? `${scholarship.discountValue}% discount`
                      : formatCurrency(scholarship.discountValue)}
                  </p>
                </div>
                <Badge
                  variant={
                    scholarship.status === "approved" ? "success" : "default"
                  }
                >
                  {scholarship.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Installments Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payment Timeline</CardTitle>
            {data?.summary.installmentCount && (
              <span className="text-xs text-text-muted">
                {data.summary.paidInstallments}/{data.summary.installmentCount}{" "}
                paid
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data?.installments && data.installments.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200" />

              <div className="space-y-0">
                {data.installments.map((installment, index) => {
                  const isPaid = installment.status === "paid";
                  const isOverdue = installment.isOverdue;
                  const isPartial = installment.status === "partial";
                  const pendingAmount =
                    installment.amount - installment.paidAmount;
                  const hasPaymentLink =
                    installment.paymentLink &&
                    installment.paymentLink.status === "active";
                  const canPay = !isPaid && pendingAmount > 0;

                  return (
                    <div
                      key={installment.id}
                      className="relative pl-12 pr-4 py-4 border-b border-border-subtle last:border-0"
                    >
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute left-4 top-5 w-4 h-4 rounded-full border-2 bg-white z-10",
                          isPaid && "border-green-500 bg-green-500",
                          isPartial && "border-blue-500 bg-blue-200",
                          isOverdue && "border-red-500 bg-red-100",
                          !isPaid &&
                            !isPartial &&
                            !isOverdue &&
                            "border-gray-300"
                        )}
                      >
                        {isPaid && (
                          <CheckCircle className="w-3 h-3 text-white absolute -top-0.5 -left-0.5" />
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            Installment {installment.installmentNumber}
                          </p>
                          <p
                            className={cn(
                              "text-xs",
                              isOverdue ? "text-red-600" : "text-text-muted"
                            )}
                          >
                            {isOverdue ? "Overdue: " : "Due: "}
                            {new Date(installment.dueDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={cn(
                                "text-xs",
                                installmentStatusColor[
                                  installment.status.toLowerCase()
                                ] || "bg-gray-100 text-gray-700"
                              )}
                            >
                              {installment.status}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatCurrency(installment.amount)}
                            </span>
                          </div>
                          {installment.paidAmount > 0 &&
                            installment.paidAmount < installment.amount && (
                              <p className="text-xs text-green-600 mt-1">
                                Paid: {formatCurrency(installment.paidAmount)}
                              </p>
                            )}
                        </div>

                        {/* Pay Now Button or Status */}
                        <div className="flex-shrink-0">
                          {canPay && hasPaymentLink ? (
                            <div className="text-right">
                              <a
                                href={installment.paymentLink!.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                  Pay {formatCurrency(pendingAmount)}
                                </Button>
                              </a>
                              <p className="text-xs text-text-muted mt-1">
                                Expires{" "}
                                {new Date(
                                  installment.paymentLink!.expiresAt
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          ) : canPay ? (
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1 text-xs text-text-muted bg-bg-app px-2 py-1 rounded">
                                <AlertTriangle className="h-3 w-3" />
                                Contact school to pay
                              </div>
                            </div>
                          ) : isPaid ? (
                            <div className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-text-muted">
              No installments found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Emergency Contacts Tab
// ============================================================================

const RELATION_OPTIONS = [
  "Grandparent",
  "Uncle",
  "Aunt",
  "Neighbor",
  "Family Friend",
  "Sibling",
  "Relative",
  "Other",
];

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relation: z.string().min(1, "Relation is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  isPrimary: z.boolean(),
  notes: z.string().optional(),
});

type EmergencyContactFormData = z.infer<typeof emergencyContactSchema>;

function EmergencyContactForm({
  open,
  onClose,
  contact,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  contact?: EmergencyContact | null;
  onSubmit: (data: EmergencyContactFormData) => void;
  isPending: boolean;
}) {
  const isEditing = !!contact;

  const form = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      name: contact?.name || "",
      relation: contact?.relation || "",
      phone: contact?.phone || "",
      isPrimary: contact?.isPrimary || false,
      notes: contact?.notes || "",
    },
  });

  const handleSubmit = (data: EmergencyContactFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Emergency Contact" : "Add Emergency Contact"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the contact details below."
              : "Add someone who can be contacted in case of emergency."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Contact name"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-error">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Relation *</Label>
            <Select
              value={form.watch("relation")}
              onValueChange={(v) => form.setValue("relation", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.relation && (
              <p className="text-xs text-error">
                {form.formState.errors.relation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              {...form.register("phone")}
              placeholder="+91 98765 43210"
            />
            {form.formState.errors.phone && (
              <p className="text-xs text-error">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="e.g., Available after 5pm, Works from home"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isPrimary"
              checked={form.watch("isPrimary")}
              onCheckedChange={(checked) =>
                form.setValue("isPrimary", !!checked)
              }
            />
            <Label
              htmlFor="isPrimary"
              className="text-sm font-normal cursor-pointer"
            >
              Mark as primary emergency contact
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmergencyContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className={cn(contact.isPrimary && "border-primary-300 bg-primary-50/30")}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                contact.isPrimary ? "bg-primary-100" : "bg-bg-app"
              )}
            >
              <User
                className={cn(
                  "h-5 w-5",
                  contact.isPrimary ? "text-primary-600" : "text-text-muted"
                )}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{contact.name}</p>
                {contact.isPrimary && (
                  <Badge className="bg-primary-100 text-primary-700 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-muted">{contact.relation}</p>
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5 text-text-muted" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-primary-600 hover:underline"
                >
                  {contact.phone}
                </a>
              </div>
              {contact.notes && (
                <p className="text-xs text-text-muted mt-1">{contact.notes}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-error hover:text-error"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmergencyTab({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "children", studentId, "emergency-contacts"],
    queryFn: () => getChildEmergencyContacts(studentId),
  });

  const updateMutation = useMutation({
    mutationFn: (contacts: EmergencyContact[]) =>
      updateChildEmergencyContacts(studentId, contacts),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["parent", "children", studentId, "emergency-contacts"],
      });
    },
    onError: () => {
      toast.error("Failed to update emergency contacts");
    },
  });

  const contacts = data?.contacts || [];

  const handleAddContact = (formData: EmergencyContactFormData) => {
    // Generate UUID for new contact
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      ...formData,
      notes: formData.notes || undefined,
    };

    // If setting as primary, unset others
    let updatedContacts = contacts;
    if (newContact.isPrimary) {
      updatedContacts = contacts.map((c) => ({ ...c, isPrimary: false }));
    }

    updateMutation.mutate([...updatedContacts, newContact], {
      onSuccess: () => {
        toast.success("Emergency contact added");
        setDialogOpen(false);
      },
    });
  };

  const handleEditContact = (formData: EmergencyContactFormData) => {
    if (!editingContact) return;

    const updatedContact: EmergencyContact = {
      ...editingContact,
      ...formData,
      notes: formData.notes || undefined,
    };

    // If setting as primary, unset others
    const updatedContacts = contacts.map((c) =>
      c.id === editingContact.id
        ? updatedContact
        : formData.isPrimary
        ? { ...c, isPrimary: false }
        : c
    );

    updateMutation.mutate(updatedContacts, {
      onSuccess: () => {
        toast.success("Emergency contact updated");
        setEditingContact(null);
      },
    });
  };

  const handleDeleteContact = () => {
    if (!deleteConfirmId) return;

    const updatedContacts = contacts.filter((c) => c.id !== deleteConfirmId);
    updateMutation.mutate(updatedContacts, {
      onSuccess: () => {
        toast.success("Emergency contact removed");
        setDeleteConfirmId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-error">Failed to load emergency contacts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {contacts.length}/5 contacts added
        </p>
        {contacts.length < 5 && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Contact
          </Button>
        )}
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-text-muted" />
            <p className="text-text-muted mb-4">
              No emergency contacts added yet
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Emergency Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Show primary first, then others */}
          {[...contacts]
            .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
            .map((contact) => (
              <EmergencyContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => setEditingContact(contact)}
                onDelete={() => setDeleteConfirmId(contact.id)}
              />
            ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <EmergencyContactForm
        open={dialogOpen || !!editingContact}
        onClose={() => {
          setDialogOpen(false);
          setEditingContact(null);
        }}
        contact={editingContact}
        onSubmit={editingContact ? handleEditContact : handleAddContact}
        isPending={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Emergency Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this emergency contact? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContact}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Child Detail Page
 *
 * Shows detailed information about a specific child:
 * - Overview (basic info, attendance summary)
 * - Attendance (detailed records)
 * - Fees (fee structure, installments)
 */
export default function ParentChildDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const {
    data: child,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load child information</p>
        <Link
          href="/parent/children"
          className="text-primary-600 hover:text-primary-700"
        >
          Go back to children list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="p-2 hover:bg-bg-app rounded-sm transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={child.photoUrl ?? undefined}
            fallback={child.firstName.charAt(0)}
            alt={`${child.firstName} ${child.lastName}`}
            size="lg"
          />
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {child.firstName} {child.lastName}
            </h1>
            <p className="text-sm text-text-muted">
              {child.batchName || "No batch assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <FeesTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <EmergencyTab studentId={studentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
