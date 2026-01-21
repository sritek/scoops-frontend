"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users,
  CreditCard,
  MessageCircle,
  ChevronRight,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Megaphone,
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
} from "@/components/ui";
import { useParentAuth } from "@/lib/auth";
import { getParentDashboard, type ParentDashboard } from "@/lib/api/parent";

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
 * Quick stat card component
 */
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  href,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subValue?: string;
  href: string;
  variant?: "default" | "warning" | "success" | "error";
}) {
  const numValue = typeof value === "number" ? value : 0;
  return (
    <Link href={href}>
      <Card
        className={cn(
          "hover:shadow-sm transition-shadow cursor-pointer",
          variant === "warning" &&
            numValue > 0 &&
            "border-yellow-200 bg-yellow-50/50",
          variant === "error" && numValue > 0 && "border-red-200 bg-red-50/50",
          variant === "success" && "border-green-200 bg-green-50/50"
        )}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-full",
              variant === "default" && "bg-primary-100 text-primary-600",
              variant === "warning" && numValue > 0
                ? "bg-yellow-100 text-yellow-600"
                : "bg-primary-100 text-primary-600",
              variant === "error" && numValue > 0
                ? "bg-red-100 text-red-600"
                : "bg-primary-100 text-primary-600",
              variant === "success" && "bg-green-100 text-green-600"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-muted">{label}</p>
            <p className="text-lg font-semibold text-text-primary">{value}</p>
            {subValue && <p className="text-xs text-text-muted">{subValue}</p>}
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Attendance status badge
 */
function AttendanceBadge({ status }: { status: string }) {
  if (status === "present") {
    return (
      <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Present
      </Badge>
    );
  }
  if (status === "absent") {
    return (
      <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Absent
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Not marked
    </Badge>
  );
}

/**
 * Enhanced child card component with per-child stats
 */
function ChildCard({ child }: { child: ParentDashboard["children"][number] }) {
  return (
    <Link href={`/parent/children/${child.id}`}>
      <Card className="hover:shadow-sm transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar
              src={child.photoUrl ?? undefined}
              fallback={child.firstName.charAt(0)}
              alt={`${child.firstName} ${child.lastName}`}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-text-primary truncate">
                  {child.firstName} {child.lastName}
                </p>
                <AttendanceBadge status={child.todayAttendance} />
              </div>
              <p className="text-sm text-text-muted truncate">
                {child.batchName || "No batch assigned"}
              </p>

              {/* Per-child stats */}
              <div className="flex items-center gap-3 mt-2 text-xs">
                {child.pendingFeeAmount > 0 && (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatCurrency(child.pendingFeeAmount)} pending
                  </span>
                )}
                {child.isPrimaryContact && (
                  <Badge variant="outline" className="text-xs">
                    Primary
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Dashboard loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      {/* Children skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Parent Dashboard Page
 *
 * Shows:
 * - Welcome message
 * - Fee summary card
 * - Quick stats (children, messages, announcements)
 * - List of children with per-child stats
 */
export default function ParentDashboardPage() {
  const { parent } = useParentAuth();

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "dashboard"],
    queryFn: getParentDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load dashboard</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  const hasPendingFees = (dashboard?.totalPendingAmount ?? 0) > 0;

  return (
    <div className="space-y-6 py-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Hello, {parent?.firstName || "Parent"}
        </h1>
        <p className="text-text-muted">
          Here&apos;s what&apos;s happening with your children
        </p>
      </div>

      {/* Fee Summary Card - Only show if there are pending fees */}
      {hasPendingFees && (
        <Link href="/parent/fees">
          <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">
                      Total Pending Fees
                    </p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {formatCurrency(dashboard?.totalPendingAmount ?? 0)}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {dashboard?.pendingInstallments ?? 0} installment
                      {(dashboard?.pendingInstallments ?? 0) !== 1 ? "s" : ""}{" "}
                      due
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Children"
          value={dashboard?.childrenCount ?? 0}
          href="/parent/children"
        />
        <StatCard
          icon={MessageCircle}
          label="Messages"
          value={dashboard?.unreadMessages ?? 0}
          subValue={dashboard?.unreadMessages ? "unread" : undefined}
          href="/parent/messages"
          variant={dashboard?.unreadMessages ? "warning" : "default"}
        />
        <StatCard
          icon={Megaphone}
          label="Updates"
          value="View"
          href="/parent/announcements"
        />
        <StatCard
          icon={CreditCard}
          label="Fees"
          value={hasPendingFees ? dashboard?.pendingInstallments ?? 0 : "Paid"}
          subValue={hasPendingFees ? "pending" : "All clear!"}
          href="/parent/fees"
          variant={hasPendingFees ? "warning" : "success"}
        />
      </div>

      {/* Children list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary-600" />
              Your Children
            </CardTitle>
            {dashboard?.children && dashboard.children.length > 2 && (
              <Link
                href="/parent/children"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            )}
          </div>
          <p className="text-sm text-text-muted">
            Today&apos;s attendance status
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard?.children && dashboard.children.length > 0 ? (
            dashboard.children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))
          ) : (
            <p className="text-center py-6 text-text-muted">
              No children linked to your account
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
