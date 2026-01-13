"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DollarSign,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import {
  useFeePlans,
  usePendingFees,
  useCreateFeePlan,
  useRecordPayment,
} from "@/lib/api/fees";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
  Badge,
  DataTable,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import type {
  FeePlan,
  StudentFee,
  FeeFrequency,
  PaymentMode,
} from "@/types/fee";
import { PAGINATION_DEFAULTS } from "@/types";

type TabType = "plans" | "pending";

/**
 * Fees Management Page
 *
 * Two tabs:
 * 1. Fee Plans - List and create fee plans
 * 2. Pending Fees - List pending/partial fees and record payments
 */
export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const { can } = usePermissions();

  const canManageFees = can("FEE_UPDATE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Fees</h1>
          <p className="text-sm text-text-muted">
            Manage fee plans and track payments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle">
        <button
          onClick={() => {
            setActiveTab("pending");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Clock className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
          Pending Fees
        </button>
        <button
          onClick={() => {
            setActiveTab("plans");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "plans"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <DollarSign
            className="inline-block mr-2 h-4 w-4"
            aria-hidden="true"
          />
          Fee Plans
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "pending" ? (
        <PendingFeesTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          canManageFees={canManageFees}
        />
      ) : (
        <FeePlansTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          canManageFees={canManageFees}
        />
      )}
    </div>
  );
}

/**
 * Pending Fees Tab
 */
function PendingFeesTab({
  currentPage,
  setCurrentPage,
  canManageFees,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  canManageFees: boolean;
}) {
  const [selectedFee, setSelectedFee] = useState<StudentFee | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");

  const { data, isLoading, error } = usePendingFees({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const { mutate: recordPayment, isPending: isRecording } = useRecordPayment();

  const fees = data?.data ?? [];
  const pagination = data?.pagination;

  const handleRecordPayment = () => {
    if (!selectedFee || !paymentAmount) return;

    recordPayment(
      {
        studentFeeId: selectedFee.id,
        amount: parseFloat(paymentAmount),
        paymentMode,
      },
      {
        onSuccess: () => {
          setSelectedFee(null);
          setPaymentAmount("");
          setPaymentMode("cash");
        },
      }
    );
  };

  const columns: ColumnDef<StudentFee>[] = useMemo(
    () => [
      {
        accessorKey: "student.fullName",
        header: "Student",
        cell: ({ row }) => (
          <p className="font-medium">{row.original.student?.fullName}</p>
        ),
      },
      {
        accessorKey: "feePlan.name",
        header: "Fee Plan",
        cell: ({ row }) => row.original.feePlan?.name,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.totalAmount),
      },
      {
        accessorKey: "pendingAmount",
        header: "Pending",
        cell: ({ row }) => (
          <span className="font-medium text-warning">
            {formatCurrency(row.original.pendingAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={
                status === "paid"
                  ? "success"
                  : status === "partial"
                  ? "warning"
                  : "error"
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManageFees && row.original.status !== "paid" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedFee(row.original)}
            >
              <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
              Record Payment
            </Button>
          ) : null,
      },
    ],
    [canManageFees]
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load pending fees. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {!isLoading && fees.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle}
            title="No pending fees"
            description="All fees have been collected"
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={fees}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No pending fees found."
          />
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={!!selectedFee} onOpenChange={() => setSelectedFee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedFee?.student.fullName}&apos;s{" "}
              {selectedFee?.feePlan.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Total Amount:</span>
                <p className="font-medium">
                  {selectedFee && formatCurrency(selectedFee.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-text-muted">Pending:</span>
                <p className="font-medium text-warning">
                  {selectedFee && formatCurrency(selectedFee.pendingAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={selectedFee?.pendingAmount}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as PaymentMode)}
              >
                <SelectTrigger id="paymentMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedFee(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={!paymentAmount || isRecording}
            >
              {isRecording ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Fee Plans Tab
 */
function FeePlansTab({
  currentPage,
  setCurrentPage,
  canManageFees,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  canManageFees: boolean;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanAmount, setNewPlanAmount] = useState("");
  const [newPlanFrequency, setNewPlanFrequency] =
    useState<FeeFrequency>("monthly");

  const { data, isLoading, error } = useFeePlans({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const { mutate: createFeePlan, isPending: isCreating } = useCreateFeePlan();

  const plans = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCreatePlan = () => {
    if (!newPlanName || !newPlanAmount) return;

    createFeePlan(
      {
        name: newPlanName,
        amount: parseFloat(newPlanAmount),
        frequency: newPlanFrequency,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewPlanName("");
          setNewPlanAmount("");
          setNewPlanFrequency("monthly");
        },
      }
    );
  };

  const columns: ColumnDef<FeePlan>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Plan Name",
        cell: ({ row }) => <p className="font-medium">{row.original.name}</p>,
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => (
          <Badge variant="info" className="capitalize">
            {row.original.frequency}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "success" : "default"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    []
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load fee plans. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        {canManageFees && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Create Fee Plan
          </Button>
        )}
      </div>

      {!isLoading && plans.length === 0 ? (
        <Card>
          <EmptyState
            icon={DollarSign}
            title="No fee plans"
            description="Create your first fee plan to start collecting fees"
            action={
              canManageFees ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create Fee Plan
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={plans}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No fee plans found."
          />
        </Card>
      )}

      {/* Create Fee Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fee Plan</DialogTitle>
            <DialogDescription>
              Create a new fee plan template for your branch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                placeholder="e.g., Monthly Tuition"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planAmount">Amount (₹)</Label>
              <Input
                id="planAmount"
                type="number"
                placeholder="Enter amount"
                value={newPlanAmount}
                onChange={(e) => setNewPlanAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planFrequency">Frequency</Label>
              <Select
                value={newPlanFrequency}
                onValueChange={(v) => setNewPlanFrequency(v as FeeFrequency)}
              >
                <SelectTrigger id="planFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              disabled={!newPlanName || !newPlanAmount || isCreating}
            >
              {isCreating ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
