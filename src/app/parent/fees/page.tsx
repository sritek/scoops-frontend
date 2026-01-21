"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CreditCard, ChevronRight, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Avatar,
  Button,
} from "@/components/ui";
import { getAllChildrenFees, type AllChildrenFees } from "@/lib/api/parent";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Child Fee Card
 */
function ChildFeeCard({
  child,
}: {
  child: AllChildrenFees["children"][number];
}) {
  const isPaid = child.totalPending <= 0;
  const hasPendingInstallments = child.pendingInstallments > 0;
  const hasPaymentLink = child.activePaymentLinks > 0 && child.nextPaymentLink;

  return (
    <Card className={cn(
      "transition-shadow",
      hasPendingInstallments && "border-yellow-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            fallback={child.studentName.charAt(0)}
            alt={child.studentName}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <Link href={`/parent/children/${child.studentId}?tab=fees`}>
              <div className="flex items-start justify-between gap-2 hover:opacity-80 transition-opacity">
                <div>
                  <h3 className="font-medium text-text-primary truncate">
                    {child.studentName}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Total: {formatCurrency(child.totalFee)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0" />
              </div>
            </Link>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isPaid ? "bg-green-50" : "bg-yellow-50"
              )}>
                <p className="text-xs text-text-muted">Pending</p>
                <p className={cn(
                  "font-semibold",
                  isPaid ? "text-green-600" : "text-yellow-600"
                )}>
                  {formatCurrency(child.totalPending)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <p className="text-xs text-text-muted">Paid</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(child.totalPaid)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {isPaid ? (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Fully Paid
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {child.pendingInstallments} Pending
                  </Badge>
                )}
                {child.scholarshipAmount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Scholarship
                  </Badge>
                )}
              </div>
              
              {/* Quick Pay Button */}
              {hasPaymentLink && (
                <a
                  href={child.nextPaymentLink!.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay Now
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function FeesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );
}

/**
 * Parent Fees Page
 *
 * Shows fee summary for all children with:
 * - Overall summary (total pending, total paid)
 * - Per-child fee cards with pending installments
 */
export default function ParentFeesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "fees"],
    queryFn: getAllChildrenFees,
  });

  if (isLoading) {
    return <FeesSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load fee information</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  const totalPending = data?.overall.totalPending ?? 0;
  const isAllPaid = totalPending <= 0;

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary-600" />
        <h1 className="text-xl font-semibold text-text-primary">Fees Overview</h1>
      </div>

      {/* Overall Summary */}
      <Card className={cn(
        !isAllPaid && "border-yellow-200 bg-yellow-50/30"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-text-muted">Total</p>
              <p className="text-lg font-bold">
                {formatCurrency(data?.overall.total ?? 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-600">Paid</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(data?.overall.totalPaid ?? 0)}
              </p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-xs",
                isAllPaid ? "text-green-600" : "text-yellow-600"
              )}>
                Pending
              </p>
              <p className={cn(
                "text-lg font-bold",
                isAllPaid ? "text-green-700" : "text-yellow-700"
              )}>
                {formatCurrency(totalPending)}
              </p>
            </div>
          </div>
          {!isAllPaid && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span>You have pending fee payments</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-child fees */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-muted">By Child</h2>
        {data?.children && data.children.length > 0 ? (
          data.children.map((child) => (
            <ChildFeeCard key={child.studentId} child={child} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-text-muted" />
              <p className="text-text-muted">No fee information available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
