"use client";

import { useState, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DollarSign,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  CreditCard,
  Eye,
  Receipt,
  Search,
  Download,
  FileText,
  Link as LinkIcon,
  Copy,
  Send,
  XCircle,
} from "lucide-react";
import {
  useFeePlans,
  usePendingFees,
  useCreateFeePlan,
  useRecordPayment,
  useReceipts,
  downloadReceiptPDF,
} from "@/lib/api/fees";
import {
  usePaymentLinks,
  useCreatePaymentLink,
  useCancelPaymentLink,
} from "@/lib/api/payments";
import { usePermissions, useDebounce } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
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
  Receipt as ReceiptType,
} from "@/types/fee";
import type { PaymentLink } from "@/types/payment";
import { PAGINATION_DEFAULTS } from "@/types";

type TabType = "plans" | "pending" | "receipts" | "links";

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
  const { user } = useAuth();

  const canManageFees = can("FEE_UPDATE");
  const isTeacher = user?.role?.toLowerCase() === "teacher";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Fees</h1>
          <p className="text-sm text-text-muted">
            {isTeacher
              ? "View pending fees for students in your batch"
              : "Manage fee plans and track payments"}
          </p>
        </div>
      </div>

      {/* Teacher view-only notice */}
      {isTeacher && (
        <div className="flex items-center gap-2 rounded-lg bg-primary-100 p-3 text-sm text-primary-600 dark:bg-primary-900/30">
          <Eye className="h-4 w-4" />
          <span>
            You have view-only access to fees for your batch. Contact accounts staff to record payments.
          </span>
        </div>
      )}

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
        <button
          onClick={() => {
            setActiveTab("receipts");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "receipts"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Receipt
            className="inline-block mr-2 h-4 w-4"
            aria-hidden="true"
          />
          Receipts
        </button>
        {canManageFees && (
          <button
            onClick={() => {
              setActiveTab("links");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "links"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <LinkIcon
              className="inline-block mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Payment Links
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "pending" && (
        <PendingFeesTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          canManageFees={canManageFees}
        />
      )}
      {activeTab === "plans" && (
        <FeePlansTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          canManageFees={canManageFees}
        />
      )}
      {activeTab === "receipts" && (
        <ReceiptsTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
      {activeTab === "links" && (
        <PaymentLinksTab
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
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
  const [creatingLinkFor, setCreatingLinkFor] = useState<string | null>(null);

  const { data, isLoading, error } = usePendingFees({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
  });

  const { mutate: recordPayment, isPending: isRecording } = useRecordPayment();
  const { mutate: createPaymentLink, isPending: isCreatingLink } = useCreatePaymentLink();

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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedFee(row.original)}
              >
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                Record
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreatingLinkFor(row.original.id);
                  createPaymentLink(
                    { studentFeeId: row.original.id },
                    {
                      onSuccess: (data) => {
                        navigator.clipboard.writeText(data.paymentUrl);
                        setCreatingLinkFor(null);
                        alert(`Payment link created and copied to clipboard!\n\n${data.paymentUrl}`);
                      },
                      onError: () => {
                        setCreatingLinkFor(null);
                      },
                    }
                  );
                }}
                disabled={isCreatingLink && creatingLinkFor === row.original.id}
                title="Create payment link"
              >
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null,
      },
    ],
    [canManageFees, isCreatingLink, creatingLinkFor, createPaymentLink]
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
 * Receipts Tab
 */
function ReceiptsTab({
  currentPage,
  setCurrentPage,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = useReceipts({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    search: debouncedSearch || undefined,
    startDate: dateFilter || undefined,
    endDate: dateFilter || undefined,
  });

  const receipts = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const handleDownloadPDF = async (receiptId: string) => {
    setIsDownloading(receiptId);
    try {
      const blob = await downloadReceiptPDF(receiptId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download receipt:", err);
    } finally {
      setIsDownloading(null);
    }
  };

  const columns: ColumnDef<ReceiptType>[] = useMemo(
    () => [
      {
        accessorKey: "receiptNumber",
        header: "Receipt #",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-muted" />
            <span className="font-mono text-sm">{row.original.receiptNumber}</span>
          </div>
        ),
      },
      {
        accessorKey: "student.fullName",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.student.fullName}</p>
            <p className="text-xs text-text-muted">{row.original.feePlan.name}</p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "paymentMode",
        header: "Mode",
        cell: ({ row }) => (
          <Badge variant="default" className="capitalize">
            {row.original.paymentMode}
          </Badge>
        ),
      },
      {
        accessorKey: "generatedAt",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.generatedAt),
      },
      {
        accessorKey: "receivedBy.fullName",
        header: "Received By",
        cell: ({ row }) => row.original.receivedBy.fullName,
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadPDF(row.original.id)}
            disabled={isDownloading === row.original.id}
          >
            <Download className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [isDownloading]
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">Failed to load receipts. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by receipt # or student..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search receipts"
          />
        </div>

        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-[180px]"
        />
      </div>

      {/* Table */}
      {!isLoading && receipts.length === 0 && !searchQuery && !dateFilter ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No receipts yet"
            description="Receipts will be generated automatically when payments are recorded"
          />
        </Card>
      ) : !isLoading && receipts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="No receipts found"
            description="Try adjusting your search or date filter"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={receipts}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No receipts found."
          />
        </Card>
      )}
    </div>
  );
}

/**
 * Payment Links Tab
 */
function PaymentLinksTab({
  currentPage,
  setCurrentPage,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, error } = usePaymentLinks({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    status: statusFilter !== "__all__" ? (statusFilter as "active" | "expired" | "paid" | "cancelled") : undefined,
    search: debouncedSearch || undefined,
  });

  const { mutate: cancelLink, isPending: isCancelling } = useCancelPaymentLink();

  const links = data?.data ?? [];
  const pagination = data?.pagination;

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleCancelLink = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this payment link?")) {
      cancelLink(id);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === "paid") {
      return <Badge variant="success">Paid</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="default">Cancelled</Badge>;
    }
    if (isExpired || status === "expired") {
      return <Badge variant="warning">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const columns: ColumnDef<PaymentLink>[] = useMemo(
    () => [
      {
        accessorKey: "studentName",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.studentName}</p>
            <p className="text-xs text-text-muted">{row.original.feePlanName}</p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status, row.original.expiresAt),
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => formatDate(row.original.expiresAt),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const link = row.original;
          const isActive = link.status === "active" && new Date(link.expiresAt) > new Date();
          
          return (
            <div className="flex items-center gap-1">
              {isActive && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyLink(link.paymentUrl, link.id)}
                    title="Copy payment link"
                  >
                    {copiedId === link.id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(link.paymentUrl, "_blank")}
                    title="Open payment link"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelLink(link.id)}
                    disabled={isCancelling}
                    title="Cancel link"
                    className="text-red-500 hover:text-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [copiedId, isCancelling]
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">Failed to load payment links. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        <LinkIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Payment Links</p>
          <p className="mt-1 text-xs opacity-90">
            Create payment links from the Pending Fees tab by clicking the link icon on any fee entry.
            Links can be shared with parents for online payment via Razorpay.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            aria-label="Search payment links"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!isLoading && links.length === 0 && !searchQuery && statusFilter === "__all__" ? (
        <Card>
          <EmptyState
            icon={LinkIcon}
            title="No payment links yet"
            description="Create payment links from the Pending Fees tab to share with parents for online payment"
          />
        </Card>
      ) : !isLoading && links.length === 0 ? (
        <Card>
          <EmptyState
            icon={LinkIcon}
            title="No payment links found"
            description="Try adjusting your search or filter"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={links}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No payment links found."
          />
        </Card>
      )}
    </div>
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
