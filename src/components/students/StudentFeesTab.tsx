"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Button,
} from "@/components/ui";
import {
  CreditCard,
  Calendar,
  Award,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  useStudentFeeSummary,
  useStudentScholarships,
  useStudentInstallments,
  useRemoveStudentScholarship,
} from "@/lib/api";
import type { InstallmentStatus } from "@/types/fee";
import { CreateFeeStructureDialog } from "./CreateFeeStructureDialog";
import { AssignScholarshipDialog } from "./AssignScholarshipDialog";
import { GenerateInstallmentsDialog } from "./GenerateInstallmentsDialog";
import { toast } from "sonner";

interface StudentFeesTabProps {
  studentId: string;
  batchId?: string | null;
}

/**
 * Student Fees Tab Component
 *
 * Displays and manages:
 * - Fee structure summary (with creation option)
 * - Applied scholarships (with assign/remove)
 * - Installment schedule (with generate option)
 */
export function StudentFeesTab({ studentId, batchId }: StudentFeesTabProps) {
  const [showCreateFeeDialog, setShowCreateFeeDialog] = useState(false);
  const [showAssignScholarshipDialog, setShowAssignScholarshipDialog] = useState(false);
  const [showGenerateInstallmentsDialog, setShowGenerateInstallmentsDialog] = useState(false);

  const { data: feeSummary, isLoading: summaryLoading, refetch: refetchSummary } = useStudentFeeSummary(studentId);
  const { data: scholarships, isLoading: scholarshipsLoading, refetch: refetchScholarships } = useStudentScholarships(studentId);
  const { data: installments, isLoading: installmentsLoading, refetch: refetchInstallments } = useStudentInstallments(studentId);
  const removeScholarship = useRemoveStudentScholarship();

  const isLoading = summaryLoading || scholarshipsLoading || installmentsLoading;

  if (isLoading) {
    return <FeesTabSkeleton />;
  }

  const currentSessionStructure = feeSummary?.feeStructures.find(
    (fs) => fs.session.isCurrent
  );

  const currentInstallments = installments?.find(
    (i) => i.session.isCurrent
  )?.installments;

  const hasFeeStructure = !!currentSessionStructure;
  const hasInstallments = currentInstallments && currentInstallments.length > 0;

  const handleRemoveScholarship = async (scholarshipId: string, scholarshipName: string) => {
    if (!confirm(`Are you sure you want to remove the "${scholarshipName}" scholarship?`)) {
      return;
    }

    try {
      await removeScholarship.mutateAsync(scholarshipId);
      toast.success("Scholarship removed successfully");
      refetchScholarships();
      refetchSummary();
    } catch (error) {
      toast.error("Failed to remove scholarship");
    }
  };

  const handleFeeStructureSuccess = () => {
    refetchSummary();
    refetchInstallments();
  };

  const handleScholarshipSuccess = () => {
    refetchScholarships();
    refetchSummary();
  };

  const handleInstallmentsSuccess = () => {
    refetchInstallments();
    refetchSummary();
  };

  return (
    <div className="space-y-6">
      {/* No Fee Structure Alert */}
      {!hasFeeStructure && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">No Fee Structure</p>
                  <p className="text-sm text-text-muted">
                    Create a fee structure to track payments for this student.
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowCreateFeeDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Fee Structure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Summary Cards */}
      {hasFeeStructure && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Gross Fee"
            value={currentSessionStructure?.grossAmount ?? 0}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <SummaryCard
            label="Scholarship"
            value={currentSessionStructure?.scholarshipAmount ?? 0}
            icon={<Award className="h-4 w-4" />}
            variant="success"
          />
          <SummaryCard
            label="Net Payable"
            value={currentSessionStructure?.netAmount ?? 0}
            icon={<TrendingDown className="h-4 w-4" />}
            highlight
          />
          <SummaryCard
            label="Pending"
            value={currentSessionStructure?.pendingAmount ?? 0}
            icon={<Clock className="h-4 w-4" />}
            variant={currentSessionStructure?.pendingAmount ? "warning" : "success"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scholarships */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-text-muted" />
              Applied Scholarships
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignScholarshipDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Assign
            </Button>
          </CardHeader>
          <CardContent>
            {scholarships && scholarships.length > 0 ? (
              <div className="space-y-3">
                {scholarships.map((ss) => (
                  <div
                    key={ss.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-subtle"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{ss.scholarship.name}</p>
                      <p className="text-sm text-text-muted">
                        {ss.scholarship.type === "percentage"
                          ? `${ss.scholarship.value}% off`
                          : ss.scholarship.type === "fixed_amount"
                          ? `₹${ss.scholarship.value.toLocaleString()} off`
                          : "Component Waiver"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">
                        -₹{ss.discountAmount.toLocaleString()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveScholarship(ss.id, ss.scholarship.name)}
                        disabled={removeScholarship.isPending}
                        className="text-error hover:text-error hover:bg-error/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No scholarships applied</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowAssignScholarshipDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Assign Scholarship
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installment Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-text-muted" />
              Installment Schedule
            </CardTitle>
            {hasFeeStructure && !hasInstallments && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateInstallmentsDialog(true)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Generate
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {hasInstallments ? (
              <div className="space-y-3">
                {currentInstallments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-subtle"
                  >
                    <div className="flex items-center gap-3">
                      <InstallmentStatusIcon status={inst.status} />
                      <div>
                        <p className="font-medium">
                          Installment {inst.installmentNumber}
                        </p>
                        <p className="text-sm text-text-muted">
                          Due: {formatDate(inst.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{inst.amount.toLocaleString()}</p>
                      {inst.paidAmount > 0 && inst.paidAmount < inst.amount && (
                        <p className="text-sm text-success">
                          Paid: ₹{inst.paidAmount.toLocaleString()}
                        </p>
                      )}
                      <InstallmentStatusBadge status={inst.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No installments generated</p>
                {hasFeeStructure ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowGenerateInstallmentsDialog(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Generate Installments
                  </Button>
                ) : (
                  <p className="text-sm mt-1">
                    Create a fee structure first to generate installments.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {currentInstallments && currentInstallments.some((i) => i.payments && i.payments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-text-muted" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Installment
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Mode
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {currentInstallments
                    .flatMap((inst) =>
                      (inst.payments || []).map((p) => ({
                        ...p,
                        installmentNumber: inst.installmentNumber,
                      }))
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.receivedAt).getTime() -
                        new Date(a.receivedAt).getTime()
                    )
                    .slice(0, 10)
                    .map((payment) => (
                      <tr key={payment.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3">{formatDate(payment.receivedAt)}</td>
                        <td className="px-4 py-3">#{payment.installmentNumber}</td>
                        <td className="px-4 py-3 capitalize">{payment.paymentMode}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateFeeStructureDialog
        open={showCreateFeeDialog}
        onOpenChange={setShowCreateFeeDialog}
        studentId={studentId}
        batchId={batchId ?? null}
        onSuccess={handleFeeStructureSuccess}
      />

      <AssignScholarshipDialog
        open={showAssignScholarshipDialog}
        onOpenChange={setShowAssignScholarshipDialog}
        studentId={studentId}
        existingScholarshipIds={scholarships?.map((s) => s.scholarshipId) ?? []}
        onSuccess={handleScholarshipSuccess}
      />

      {currentSessionStructure && (
        <GenerateInstallmentsDialog
          open={showGenerateInstallmentsDialog}
          onOpenChange={setShowGenerateInstallmentsDialog}
          studentFeeStructureId={currentSessionStructure.id}
          netAmount={currentSessionStructure.netAmount}
          onSuccess={handleInstallmentsSuccess}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  variant,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: "success" | "warning" | "error";
  highlight?: boolean;
}) {
  const colorClass =
    variant === "success"
      ? "text-green-600"
      : variant === "warning"
      ? "text-amber-600"
      : variant === "error"
      ? "text-red-600"
      : "text-text-primary";

  return (
    <Card className={highlight ? "border-primary-500 bg-primary-50" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <p className={`text-2xl font-semibold ${colorClass}`}>
          ₹{value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function InstallmentStatusIcon({ status }: { status: InstallmentStatus }) {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-5 w-5 text-success" />;
    case "overdue":
      return <AlertCircle className="h-5 w-5 text-error" />;
    case "due":
    case "partial":
      return <Clock className="h-5 w-5 text-warning" />;
    default:
      return <Clock className="h-5 w-5 text-text-muted" />;
  }
}

function InstallmentStatusBadge({ status }: { status: InstallmentStatus }) {
  const variants: Record<InstallmentStatus, "success" | "warning" | "error" | "default"> = {
    paid: "success",
    partial: "warning",
    due: "warning",
    overdue: "error",
    upcoming: "default",
  };

  return (
    <Badge variant={variants[status]} className="capitalize mt-1">
      {status}
    </Badge>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FeesTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
