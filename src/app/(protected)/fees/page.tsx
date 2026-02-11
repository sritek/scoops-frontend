"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
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
  Layers,
  Award,
  Calendar,
  Trash2,
  MoreHorizontal,
  Pencil,
  Users,
} from "lucide-react";
import { useReceipts, downloadReceiptPDF } from "@/lib/api/fees";
import {
  usePaymentLinks,
  useCreatePaymentLink,
  useCancelPaymentLink,
} from "@/lib/api/payments";
import {
  useFeeComponents,
  useCreateFeeComponent,
  useDeleteFeeComponent,
  useScholarships,
  useCreateScholarship,
  useDeleteScholarship,
  useEMITemplates,
  useCreateEMITemplate,
  usePendingInstallments,
  useRecordInstallmentPayment,
  useBatches,
  useBatchFeeStructures,
  useBatchFeeStructureByBatch,
  useCreateBatchFeeStructure,
  useUpdateBatchFeeStructure,
  useDeleteBatchFeeStructure,
  useAllFeeComponents,
  useApplyBatchFeeStructure,
} from "@/lib/api";
import { useSessions } from "@/lib/api/sessions";
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
  Skeleton,
  CardGridSkeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import type {
  PaymentMode,
  Receipt as ReceiptType,
  FeeComponent,
  EMIPlanTemplate,
  PendingInstallment,
  InstallmentStatus,
  BatchFeeStructure,
} from "@/types/fee";
import type { Scholarship } from "@/types/scholarship";
import type { PaymentLink } from "@/types/payment";
import { PAGINATION_DEFAULTS } from "@/types";
import Link from "next/link";

type TabType =
  | "pending"
  | "receipts"
  | "links"
  | "components"
  | "scholarships"
  | "emi-templates"
  | "batch-structures";

const VALID_TABS: TabType[] = [
  "pending",
  "receipts",
  "links",
  "components",
  "scholarships",
  "emi-templates",
  "batch-structures",
];

/**
 * Fees Management Page
 *
 * Tabs:
 * 1. Pending Fees - List pending/partial fees and record payments
 * 2. Pending Fees - List pending/partial fees and record payments
 */
export default function FeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial tab from URL, default to "pending"
  const tabFromUrl = searchParams.get("tab") as TabType | null;
  const initialTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "pending";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const { can } = usePermissions();
  const { user } = useAuth();

  const canManageFees = can("FEE_UPDATE");
  const isTeacher = user?.role?.toLowerCase() === "teacher";

  // Update URL when tab changes
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      setCurrentPage(1);
      // Update URL without adding to history
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/fees?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Fees</h1>
          <p className="text-sm text-text-muted">
            {isTeacher
              ? "View pending fees for students in your batch"
              : "Manage fees and track payments"}
          </p>
        </div>
      </div>

      {/* Teacher view-only notice */}
      {isTeacher && (
        <div className="flex items-center gap-2 rounded-lg bg-primary-100 p-3 text-sm text-primary-600 dark:bg-primary-900/30">
          <Eye className="h-4 w-4" />
          <span>
            You have view-only access to fees for your batch. Contact accounts
            staff to record payments.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle">
        <button
          onClick={() => handleTabChange("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "pending"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Clock className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
          Pending Fees
        </button>
        <button
          onClick={() => handleTabChange("receipts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === "receipts"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <Receipt className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
          Receipts
        </button>
        {canManageFees && (
          <button
            onClick={() => handleTabChange("links")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
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
        {canManageFees && (
          <>
            <button
              onClick={() => handleTabChange("components")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "components"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Layers
                className="inline-block mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Components
            </button>
            <button
              onClick={() => handleTabChange("scholarships")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "scholarships"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Award className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
              Scholarships
            </button>
            <button
              onClick={() => handleTabChange("emi-templates")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "emi-templates"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Calendar
                className="inline-block mr-2 h-4 w-4"
                aria-hidden="true"
              />
              EMI Templates
            </button>
            <button
              onClick={() => handleTabChange("batch-structures")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === "batch-structures"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <Layers
                className="inline-block mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Batch Fee Structures
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "pending" && (
        <PendingInstallmentsTab
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
      {activeTab === "components" && <FeeComponentsTab />}
      {activeTab === "scholarships" && <ScholarshipsTab />}
      {activeTab === "emi-templates" && <EMITemplatesTab />}
      {activeTab === "batch-structures" && <BatchFeeStructuresTab />}
    </div>
  );
}

/**
 * Pending Installments Tab
 * Shows pending fee installments and allows recording payments
 */
function PendingInstallmentsTab({
  currentPage,
  setCurrentPage,
  canManageFees,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  canManageFees: boolean;
}) {
  const [selectedInstallment, setSelectedInstallment] =
    useState<PendingInstallment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    InstallmentStatus | "__all__"
  >("__all__");
  const [batchFilter, setBatchFilter] = useState<string>("__all__");
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULTS.LIMIT);
  const [creatingLinkFor, setCreatingLinkFor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: batchesData } = useBatches({ limit: 100 });
  const batches = batchesData?.data ?? [];

  const { data, isLoading, error } = usePendingInstallments({
    page: currentPage,
    limit: pageSize,
    status: statusFilter !== "__all__" ? statusFilter : undefined,
    batchId: batchFilter !== "__all__" ? batchFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const { mutate: recordPayment, isPending: isRecording } =
    useRecordInstallmentPayment();
  const { mutate: createPaymentLink, isPending: isCreatingLink } =
    useCreatePaymentLink();

  const installments = data?.data ?? [];
  const pagination = data?.pagination;

  const resetPaymentState = () => {
    setSelectedInstallment(null);
    setPaymentAmount("");
    setPaymentMode("cash");
    setTransactionRef("");
    setRemarks("");
    setAmountError(null);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (value === "") {
      setPaymentAmount("");
      setAmountError(null);
      return;
    }

    // Normalize: remove commas and non-numeric/non-dot characters
    value = value.replace(/,/g, "");
    value = value.replace(/[^0-9.]/g, "");

    // Prevent multiple dots
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    setPaymentAmount(value);

    // Live validate against pending amount as user types
    if (selectedInstallment) {
      const amount = parseFloat(value);
      const pending = selectedInstallment.pendingAmount;

      if (!Number.isNaN(amount) && amount > pending) {
        setAmountError(
          `Amount cannot exceed pending ${formatCurrency(pending)}`,
        );
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  };

  const handleRecordPayment = () => {
    if (!selectedInstallment) return;

    const raw = paymentAmount.trim();
    if (!raw) {
      setAmountError("Enter a valid amount greater than 0.");
      return;
    }

    const amount = parseFloat(raw);
    if (Number.isNaN(amount) || amount <= 0) {
      setAmountError("Enter a valid amount greater than 0.");
      return;
    }

    const pending = selectedInstallment.pendingAmount;
    if (amount > pending) {
      setAmountError(
        `Amount cannot exceed pending ${formatCurrency(pending)}`,
      );
      return;
    }

    setAmountError(null);

    recordPayment(
      {
        installmentId: selectedInstallment.id,
        data: {
          amount,
          paymentMode,
          transactionRef: transactionRef || undefined,
          remarks: remarks || undefined,
        },
      },
      {
        onSuccess: () => {
          resetPaymentState();
        },
        onError: (err: unknown) => {
          const message =
            (err as { message?: string })?.message ??
            (err instanceof Error ? err.message : null) ??
            "Failed to record payment";
          toast.error(message);
        },
      },
    );
  };

  const getStatusBadge = (status: InstallmentStatus) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "partial":
        return <Badge variant="warning">Partial</Badge>;
      case "overdue":
        return <Badge variant="error">Overdue</Badge>;
      case "due":
        return <Badge variant="warning">Due</Badge>;
      case "upcoming":
        return <Badge variant="default">Upcoming</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const columns: ColumnDef<PendingInstallment>[] = useMemo(
    () => [
      {
        accessorKey: "student.fullName",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.student?.fullName}</p>
            {row.original.student?.batch && (
              <p className="text-xs text-text-muted">
                {row.original.student.batch.name}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "installmentNumber",
        header: "Installment",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            #{row.original.installmentNumber}
          </span>
        ),
      },
      {
        accessorKey: "session.name",
        header: "Session",
        cell: ({ row }) => row.original.session?.name,
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
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
        cell: ({ row }) => getStatusBadge(row.original.status),
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
                onClick={() => setSelectedInstallment(row.original)}
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
                    { installmentId: row.original.id },
                    {
                      onSuccess: (data) => {
                        navigator.clipboard.writeText(data.paymentUrl);
                        setCreatingLinkFor(null);
                        alert(
                          `Payment link created and copied to clipboard!\n\n${data.paymentUrl}`,
                        );
                      },
                      onError: () => {
                        setCreatingLinkFor(null);
                      },
                    },
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
    [canManageFees, isCreatingLink, creatingLinkFor, createPaymentLink],
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load pending installments. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
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
            aria-label="Search pending installments"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as InstallmentStatus | "__all__");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All status</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="due">Due</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={batchFilter}
          onValueChange={(value) => {
            setBatchFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading &&
      installments.length === 0 &&
      statusFilter === "__all__" &&
      batchFilter === "__all__" &&
      !searchQuery ? (
        <Card>
          <EmptyState
            icon={CheckCircle}
            title="No pending installments"
            description="All fee installments have been collected"
          />
        </Card>
      ) : !isLoading && installments.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="No installments found"
            description="Try adjusting your search or filters"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter("__all__");
                  setBatchFilter("__all__");
                  setSearchQuery("");
                  setCurrentPage(1);
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
            data={installments}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={pageSize}
            onLimitChange={(limit) => {
              setPageSize(limit);
              setCurrentPage(1);
            }}
            limitOptions={[10, 20, 50, 100]}
            emptyMessage="No pending installments found."
          />
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        open={!!selectedInstallment}
        onOpenChange={(open) => {
          if (!open) {
            resetPaymentState();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedInstallment?.student.fullName}
              &apos;s installment #{selectedInstallment?.installmentNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted">Installment Amount:</span>
                <p className="font-medium">
                  {selectedInstallment &&
                    formatCurrency(selectedInstallment.amount)}
                </p>
              </div>
              <div>
                <span className="text-text-muted">Pending:</span>
                <p className="font-medium text-warning">
                  {selectedInstallment &&
                    formatCurrency(selectedInstallment.pendingAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={handleAmountChange}
              />
              {amountError && (
                <p className="mt-1 text-xs text-error">{amountError}</p>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="transactionRef">
                Transaction Reference (optional)
              </Label>
              <Input
                id="transactionRef"
                placeholder="e.g., UPI ID or bank reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Input
                id="remarks"
                placeholder="Any additional notes"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={resetPaymentState}
            >
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

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setCurrentPage(1);
    },
    [setCurrentPage],
  );

  const handleDownloadPDF = async (receipt: ReceiptType) => {
    setIsDownloading(receipt.id);
    try {
      const blob = await downloadReceiptPDF(receipt.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Build a friendly file name: receipt_student-name_YYYY-MM-DD.pdf
      const safeStudentName = receipt.student.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const date = new Date(receipt.generatedAt);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const datePart = `${y}-${m}-${d}`;

      a.download = `receipt_${safeStudentName}_${datePart}.pdf`;
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
            <span className="font-mono text-sm">
              {row.original.receiptNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "student.fullName",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.student.fullName}</p>
            <p className="text-xs text-text-muted">
              Installment #{row.original.installment.installmentNumber} •{" "}
              {row.original.session.name}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.amount)}
          </span>
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
            onClick={() => handleDownloadPDF(row.original)}
            disabled={isDownloading === row.original.id}
          >
            <Download className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [isDownloading],
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load receipts. Please try again.
          </p>
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
    status:
      statusFilter !== "__all__"
        ? (statusFilter as "active" | "expired" | "paid" | "cancelled")
        : undefined,
    search: debouncedSearch || undefined,
  });

  const { mutate: cancelLink, isPending: isCancelling } =
    useCancelPaymentLink();

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
            <p className="text-xs text-text-muted">
              Installment #{row.original.installmentNumber} •{" "}
              {row.original.sessionName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          getStatusBadge(row.original.status, row.original.expiresAt),
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
          const isActive =
            link.status === "active" && new Date(link.expiresAt) > new Date();

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
    [copiedId, isCancelling],
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load payment links. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-app p-4 text-sm text-text-primary">
        <LinkIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-muted" />
        <div>
          <p className="font-medium">Payment Links</p>
          <p className="mt-1 text-xs text-text-muted">
            Create payment links from the Pending Fees tab by clicking the link
            icon on any fee entry. Links can be shared with parents for online
            payment via Razorpay.
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
      {!isLoading &&
      links.length === 0 &&
      !searchQuery &&
      statusFilter === "__all__" ? (
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
 * Fee Components Tab (Phase 3)
 */
function FeeComponentsTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("tuition");
  const [newDescription, setNewDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FeeComponent | null>(null);

  const { data, isLoading } = useFeeComponents({ limit: 50 });
  const { mutate: createComponent, isPending: isCreating } =
    useCreateFeeComponent();
  const { mutate: deleteComponent, isPending: isDeleting } =
    useDeleteFeeComponent();

  const components = data?.data ?? [];

  const handleCreate = () => {
    if (!newName) return;
    createComponent(
      {
        name: newName,
        type: newType as FeeComponent["type"],
        description: newDescription || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Fee component created successfully");
          setShowCreateDialog(false);
          setNewName("");
          setNewType("tuition");
          setNewDescription("");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create fee component",
          );
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteComponent(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Fee component deactivated successfully");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to deactivate fee component",
        );
      },
      onSettled: () => {
        setDeleteTarget(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </div>

      {components.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No fee components"
            description="Create fee components to build fee structures"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {components.map((comp) => (
            <Card key={comp.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{comp.name}</p>
                    <Badge variant="default" className="mt-1 capitalize">
                      {comp.type.replace("_", " ")}
                    </Badge>
                    {comp.description && (
                      <p className="text-sm text-text-muted mt-2">
                        {comp.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(comp)}
                    disabled={isDeleting}
                    title="Deactivate"
                    aria-label="Deactivate fee component"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Deactivate Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate fee component</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Are you sure you want to deactivate "${deleteTarget.name}"?`
                : "Are you sure you want to deactivate this fee component?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fee Component</DialogTitle>
            <DialogDescription>
              Add a new fee component for building fee structures
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="compName">Name</Label>
              <Input
                id="compName"
                placeholder="e.g., Tuition Fee"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compType">Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger id="compType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tuition">Tuition</SelectItem>
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="misc">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="compDesc">Description (optional)</Label>
              <Input
                id="compDesc"
                placeholder="Brief description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName || isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Scholarships Tab (Phase 3)
 */
function ScholarshipsTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"percentage" | "fixed_amount">(
    "percentage",
  );
  const [newBasis, setNewBasis] = useState("merit");
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Scholarship | null>(null);

  const { data, isLoading } = useScholarships({ limit: 50 });
  const { mutate: createScholarship, isPending: isCreating } =
    useCreateScholarship();
  const { mutate: deleteScholarship, isPending: isDeleting } =
    useDeleteScholarship();

  const scholarships = data?.data ?? [];

  const handleCreate = () => {
    if (!newName || !newValue) return;
    createScholarship(
      {
        name: newName,
        type: newType,
        basis: newBasis as Scholarship["basis"],
        value: parseFloat(newValue),
        description: newDescription || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Scholarship created successfully");
          setShowCreateDialog(false);
          setNewName("");
          setNewType("percentage");
          setNewBasis("merit");
          setNewValue("");
          setNewDescription("");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create scholarship",
          );
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteScholarship(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Scholarship deleted successfully");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete scholarship",
        );
      },
      onSettled: () => {
        setDeleteTarget(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-36" />
        </div>
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Scholarship
        </Button>
      </div>

      {scholarships.length === 0 ? (
        <Card>
          <EmptyState
            icon={Award}
            title="No scholarships"
            description="Create scholarships to offer discounts to students"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Scholarship
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scholarships.map((sch) => (
            <Card key={sch.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{sch.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success">
                        {sch.type === "percentage"
                          ? `${sch.value}% off`
                          : `₹${sch.value.toLocaleString()} off`}
                      </Badge>
                      <Badge variant="default" className="capitalize">
                        {sch.basis.replace("_", " ")}
                      </Badge>
                    </div>
                    {sch.description && (
                      <p className="text-sm text-text-muted mt-2">
                        {sch.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(sch)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Delete Scholarship Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete scholarship</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Are you sure you want to delete "${deleteTarget.name}"?`
                : "Are you sure you want to delete this scholarship?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scholarship</DialogTitle>
            <DialogDescription>
              Add a new scholarship to offer discounts to students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schName">Name</Label>
              <Input
                id="schName"
                placeholder="e.g., Merit Scholarship"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schType">Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as typeof newType)}
                >
                  <SelectTrigger id="schType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schValue">
                  {newType === "percentage" ? "Percentage (%)" : "Amount (₹)"}
                </Label>
                <Input
                  id="schValue"
                  type="number"
                  placeholder={
                    newType === "percentage" ? "e.g., 25" : "e.g., 5000"
                  }
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schBasis">Basis</Label>
              <Select value={newBasis} onValueChange={setNewBasis}>
                <SelectTrigger id="schBasis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merit">Merit</SelectItem>
                  <SelectItem value="need_based">Need Based</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="staff_ward">Staff Ward</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schDesc">Description (optional)</Label>
              <Input
                id="schDesc"
                placeholder="Brief description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
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
              onClick={handleCreate}
              disabled={!newName || !newValue || isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * EMI Templates Tab (Phase 3)
 */
function EMITemplatesTab() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInstallmentCount, setNewInstallmentCount] = useState("4");
  const [isDefault, setIsDefault] = useState(false);

  const { data, isLoading } = useEMITemplates();
  const { mutate: createTemplate, isPending: isCreating } =
    useCreateEMITemplate();

  const templates = data ?? [];

  const handleCreate = () => {
    if (!newName || !newInstallmentCount) return;

    const count = parseInt(newInstallmentCount);
    const percentPerInstallment = Math.floor(100 / count);
    const remainder = 100 - percentPerInstallment * count;

    // Generate split config - equal distribution with remainder in last
    const splitConfig = Array.from({ length: count }, (_, i) => ({
      percent:
        i === count - 1
          ? percentPerInstallment + remainder
          : percentPerInstallment,
      dueDaysFromStart: i * Math.floor(365 / count),
    }));

    createTemplate(
      {
        name: newName,
        installmentCount: count,
        splitConfig,
        isDefault,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          setNewName("");
          setNewInstallmentCount("4");
          setIsDefault(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No EMI templates"
            description="Create EMI templates to define installment plans"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className={tmpl.isDefault ? "border-primary-500" : ""}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tmpl.name}</p>
                      {tmpl.isDefault && (
                        <Badge variant="info" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-1">
                      {tmpl.installmentCount} installments
                    </p>
                    <div className="mt-2 text-xs text-text-muted">
                      {(
                        tmpl.splitConfig as Array<{
                          percent: number;
                          dueDaysFromStart: number;
                        }>
                      )
                        .slice(0, 4)
                        .map((split, idx) => (
                          <span key={idx}>
                            {idx > 0 && " • "}
                            {split.percent}%
                          </span>
                        ))}
                      {tmpl.installmentCount > 4 && " ..."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create EMI Template</DialogTitle>
            <DialogDescription>
              Add a new EMI template for generating installments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emiName">Name</Label>
              <Input
                id="emiName"
                placeholder="e.g., Quarterly"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emiCount">Number of Installments</Label>
              <Select
                value={newInstallmentCount}
                onValueChange={setNewInstallmentCount}
              >
                <SelectTrigger id="emiCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (One-time)</SelectItem>
                  <SelectItem value="2">2 (Half-yearly)</SelectItem>
                  <SelectItem value="3">3 (Trimester)</SelectItem>
                  <SelectItem value="4">4 (Quarterly)</SelectItem>
                  <SelectItem value="6">6 (Bi-monthly)</SelectItem>
                  <SelectItem value="12">12 (Monthly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emiDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="emiDefault" className="text-sm font-normal">
                Set as default template
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName || isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Batch Fee Structures Tab
 * Shows all batch fee structures with filtering and management actions
 */
function BatchFeeStructuresTab() {
  // Next.js router for navigation
  const router = useRouter();

  // Fetch sessions for filter dropdown
  const { data: sessionsData } = useSessions({ limit: 50 });
  const sessions = sessionsData?.data ?? [];

  // Find current session
  const currentSession = useMemo(
    () => sessions.find((s) => s.isCurrent),
    [sessions],
  );

  // State for session filter - default to current session when available
  const [sessionFilter, setSessionFilter] = useState<string>("");

  // Set default session filter to current session when sessions load (only once)
  const hasSetDefaultSession = useRef(false);
  useEffect(() => {
    if (currentSession && !hasSetDefaultSession.current) {
      hasSetDefaultSession.current = true;
      setSessionFilter(currentSession.id);
    }
  }, [currentSession]);

  // State for dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  // State for selected/editing structure
  const [selectedStructure, setSelectedStructure] =
    useState<BatchFeeStructure | null>(null);
  const [editingStructure, setEditingStructure] =
    useState<BatchFeeStructure | null>(null);

  // Delete mutation
  const { mutate: deleteStructure, isPending: isDeleting } =
    useDeleteBatchFeeStructure();

  // Fetch batch fee structures with session filter
  const { data: structures, isLoading } = useBatchFeeStructures(
    sessionFilter || undefined,
  );

  // Sort structures by session (descending) and batch name (ascending)
  const sortedStructures = useMemo(() => {
    if (!structures) return [];
    return [...structures].sort((a, b) => {
      // First sort by session name descending
      const sessionCompare = b.session.name.localeCompare(a.session.name);
      if (sessionCompare !== 0) return sessionCompare;
      // Then by batch name ascending
      return a.batch.name.localeCompare(b.batch.name);
    });
  }, [structures]);

  // Handle delete
  const handleDelete = useCallback(
    (structure: BatchFeeStructure) => {
      if (
        window.confirm(
          `Are you sure you want to delete the fee structure for "${structure.batch.name}"? This action cannot be undone.`,
        )
      ) {
        deleteStructure(structure.id, {
          onSuccess: () => {
            toast.success("Fee structure deleted successfully");
          },
          onError: (err) => {
            toast.error(
              err instanceof Error
                ? err.message
                : "Failed to delete fee structure",
            );
          },
        });
      }
    },
    [deleteStructure],
  );

  // Check if a structure is from a previous (non-current) session
  const isPreviousSession = useCallback(
    (structure: BatchFeeStructure) => {
      return currentSession && structure.sessionId !== currentSession.id;
    },
    [currentSession],
  );

  // Table columns definition
  const columns: ColumnDef<BatchFeeStructure>[] = useMemo(
    () => [
      {
        accessorKey: "batch.name",
        header: "Batch",
        cell: ({ row }) => (
          <Link
            href={`/batches/${row.original.batchId}`}
            className="text-primary-600 hover:underline"
          >
            {row.original.batch.name}
          </Link>
        ),
      },
      {
        accessorKey: "session.name",
        header: "Session",
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            {row.original.session.name}
            {isPreviousSession(row.original) && (
              <Badge variant="default" className="text-xs">
                Past
              </Badge>
            )}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "_count.lineItems",
        header: "Components",
        cell: ({ row }) => {
          const count = row.original._count?.lineItems ?? 0;
          return (
            <span className="text-text-muted">
              {count} {count === 1 ? "component" : "components"}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="default">Inactive</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isReadOnly = isPreviousSession(row.original);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/batches/${row.original.batchId}/fees`)
                  }
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                {!isReadOnly && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setEditingStructure(row.original)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedStructure(row.original);
                        setShowApplyDialog(true);
                      }}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Apply to Students
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(row.original)}
                      className="text-red-600 focus:text-red-600"
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router, isPreviousSession, handleDelete, isDeleting],
  );

  // Handler to close create/edit dialog
  const handleCloseCreateEditDialog = useCallback(() => {
    setShowCreateDialog(false);
    setEditingStructure(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select session" />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.name}
                {session.isCurrent && " (Current)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Structure
        </Button>
      </div>

      {/* Empty state when no structures exist */}
      {!isLoading && sortedStructures.length === 0 && (
        <Card>
          <EmptyState
            icon={Layers}
            title="No batch fee structures"
            description="Create fee structures for batches to define default fees"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Structure
              </Button>
            }
          />
        </Card>
      )}

      {/* Structures table */}
      {(isLoading || sortedStructures.length > 0) && (
        <Card>
          <DataTable
            columns={columns}
            data={sortedStructures}
            paginationMode="client"
            pageSize={20}
            isLoading={isLoading}
            emptyMessage="No batch fee structures found."
          />
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <CreateEditBatchFeeStructureDialog
        open={showCreateDialog || !!editingStructure}
        onOpenChange={(open) => {
          if (!open) handleCloseCreateEditDialog();
        }}
        editingStructure={editingStructure}
        sessions={sessions}
        onSuccess={handleCloseCreateEditDialog}
      />

      {/* Apply to Students Dialog */}
      <ApplyToStudentsDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        structure={selectedStructure}
        onSuccess={() => {
          setShowApplyDialog(false);
          setSelectedStructure(null);
        }}
      />
    </div>
  );
}

/**
 * Zod schema for batch fee structure form
 */
const batchFeeStructureFormSchema = z.object({
  name: z.string().max(255, "Name is too long").optional(),
  batchId: z.string().uuid("Please select a batch"),
  sessionId: z.string().uuid("Please select a session"),
  lineItems: z
    .array(
      z.object({
        id: z.string(), // Temporary ID for React key
        feeComponentId: z.string().uuid("Please select a fee component"),
        amount: z.number().positive("Amount must be greater than 0"),
      }),
    )
    .min(1, "Please add at least one fee component"),
});

type BatchFeeStructureFormData = z.infer<typeof batchFeeStructureFormSchema>;

/**
 * Create/Edit Batch Fee Structure Dialog
 * Handles both creating new and editing existing batch fee structures
 * Uses react-hook-form with zod validation
 */
function CreateEditBatchFeeStructureDialog({
  open,
  onOpenChange,
  editingStructure,
  sessions,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStructure: BatchFeeStructure | null;
  sessions: Array<{ id: string; name: string; isCurrent?: boolean }>;
  onSuccess: () => void;
}) {
  // Fetch batches for dropdown
  const { data: batchesData } = useBatches({ limit: 100 });
  const batches = batchesData?.data ?? [];

  // Fetch all fee components for dropdown
  const { data: feeComponents } = useAllFeeComponents();

  // Fetch full structure with line items when editing
  // The list API only returns _count.lineItems, not the actual lineItems array
  const { data: fullStructure, isLoading: isLoadingStructure } =
    useBatchFeeStructureByBatch(
      editingStructure?.batchId ?? null,
      editingStructure?.sessionId ?? null,
    );

  // Create mutation (POST)
  const { mutate: createStructure, isPending: isCreating } =
    useCreateBatchFeeStructure();

  // Update mutation (PATCH)
  const { mutate: updateStructure, isPending: isUpdating } =
    useUpdateBatchFeeStructure();

  // Find current session
  const currentSession = sessions.find((s) => s.isCurrent);

  const isEditing = !!editingStructure;
  const isLoadingEditData = isEditing && isLoadingStructure;
  const isSaving = isCreating || isUpdating;

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BatchFeeStructureFormData>({
    resolver: zodResolver(batchFeeStructureFormSchema),
    defaultValues: {
      name: "",
      batchId: "",
      sessionId: currentSession?.id ?? "",
      lineItems: [],
    },
  });

  // Watch lineItems for total calculation and available components
  const lineItems = watch("lineItems");

  // Reset form when dialog opens/closes or editing structure changes
  useEffect(() => {
    if (open) {
      if (editingStructure) {
        // When editing, immediately set batch/session from editingStructure
        // This ensures they show up even before fullStructure loads
        if (fullStructure) {
          // Full structure loaded - populate everything including lineItems
          reset({
            name: fullStructure.name,
            batchId: fullStructure.batchId,
            sessionId: fullStructure.sessionId,
            lineItems:
              fullStructure.lineItems?.map((item) => ({
                id: item.id,
                feeComponentId: item.feeComponentId,
                amount: item.amount,
              })) ?? [],
          });
        } else {
          // Full structure not loaded yet - populate batch/session from editingStructure
          reset({
            name: editingStructure.name,
            batchId: editingStructure.batchId,
            sessionId: editingStructure.sessionId,
            lineItems: [], // Will be populated when fullStructure loads
          });
        }
      } else {
        // Reset form for new structure
        reset({
          name: "",
          batchId: "",
          sessionId: currentSession?.id ?? "",
          lineItems: [],
        });
      }
    }
  }, [open, editingStructure, fullStructure, currentSession?.id, reset]);

  // Calculate total amount from line items
  const totalAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [lineItems]);

  // Add a new line item
  const handleAddLineItem = useCallback(() => {
    const currentItems = lineItems || [];
    setValue("lineItems", [
      ...currentItems,
      {
        id: `temp-${Date.now()}`,
        feeComponentId: "",
        amount: 0,
      },
    ]);
  }, [lineItems, setValue]);

  // Remove a line item
  const handleRemoveLineItem = useCallback(
    (id: string) => {
      setValue(
        "lineItems",
        lineItems.filter((item) => item.id !== id),
      );
    },
    [lineItems, setValue],
  );

  // Update a line item
  const handleUpdateLineItem = useCallback(
    (
      id: string,
      field: "feeComponentId" | "amount",
      value: string | number,
    ) => {
      setValue(
        "lineItems",
        lineItems.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
    },
    [lineItems, setValue],
  );

  // Get available fee components (not already selected)
  const getAvailableComponents = useCallback(
    (currentItemId: string) => {
      const selectedIds = lineItems
        .filter((item) => item.id !== currentItemId)
        .map((item) => item.feeComponentId);
      return (feeComponents ?? []).filter(
        (comp) => !selectedIds.includes(comp.id),
      );
    },
    [lineItems, feeComponents],
  );

  // Handle form submission
  const onSubmit = useCallback(
    (data: BatchFeeStructureFormData) => {
      // Generate name if not provided
      const structureName =
        data.name?.trim() ||
        `${batches.find((b) => b.id === data.batchId)?.name ?? "Batch"} Fee Structure`;

      const lineItemsPayload = data.lineItems.map((item) => ({
        feeComponentId: item.feeComponentId,
        amount: item.amount,
      }));

      if (isEditing && fullStructure) {
        // Use PATCH for updates
        updateStructure(
          {
            id: fullStructure.id,
            data: {
              name: structureName,
              lineItems: lineItemsPayload,
            },
          },
          {
            onSuccess: () => {
              toast.success("Fee structure updated successfully");
              onSuccess();
            },
            onError: (err) => {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to update fee structure",
              );
            },
          },
        );
      } else {
        // Use POST for creates
        createStructure(
          {
            batchId: data.batchId,
            sessionId: data.sessionId,
            name: structureName,
            lineItems: lineItemsPayload,
          },
          {
            onSuccess: () => {
              toast.success("Fee structure created successfully");
              onSuccess();
            },
            onError: (err) => {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to create fee structure",
              );
            },
          },
        );
      }
    },
    [
      batches,
      isEditing,
      fullStructure,
      createStructure,
      updateStructure,
      onSuccess,
    ],
  );

  // Get first error message for display
  const errorMessage = useMemo(() => {
    if (errors.batchId?.message) return errors.batchId.message;
    if (errors.sessionId?.message) return errors.sessionId.message;
    if (errors.lineItems?.message) return errors.lineItems.message;
    if (errors.lineItems?.root?.message) return errors.lineItems.root.message;
    // Check for individual line item errors
    const lineItemErrors = errors.lineItems as
      | Array<{
          feeComponentId?: { message?: string };
          amount?: { message?: string };
        }>
      | undefined;
    if (lineItemErrors) {
      for (const itemError of lineItemErrors) {
        if (itemError?.feeComponentId?.message)
          return itemError.feeComponentId.message;
        if (itemError?.amount?.message) return itemError.amount.message;
      }
    }
    return null;
  }, [errors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Fee Structure" : "Create Fee Structure"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the fee structure for this batch"
              : "Create a new fee structure for a batch"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingEditData ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errorMessage}
              </div>
            )}

            {/* Structure Name */}
            <div className="space-y-2">
              <Label htmlFor="structureName">Name (optional)</Label>
              <Input
                id="structureName"
                placeholder="e.g., Class 10 Fee Structure"
                {...register("name")}
              />
              <p className="text-xs text-text-muted">
                Leave blank to auto-generate from batch name
              </p>
            </div>

            {/* Batch Selection */}
            <div className="space-y-2">
              <Label htmlFor="batchSelect">Batch</Label>
              <Controller
                name="batchId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEditing}
                  >
                    <SelectTrigger id="batchSelect">
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isEditing && (
                <p className="text-xs text-text-muted">
                  Batch cannot be changed when editing
                </p>
              )}
            </div>

            {/* Session Selection */}
            <div className="space-y-2">
              <Label htmlFor="sessionSelect">Academic Session</Label>
              <Controller
                name="sessionId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEditing}
                  >
                    <SelectTrigger id="sessionSelect">
                      <SelectValue placeholder="Select a session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name}
                          {session.isCurrent && " (Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {isEditing && (
                <p className="text-xs text-text-muted">
                  Session cannot be changed when editing
                </p>
              )}
            </div>

            {/* Fee Components Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fee Components</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddLineItem}
                  disabled={
                    !feeComponents ||
                    lineItems.length >= (feeComponents?.length ?? 0)
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Component
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-subtle p-4 text-center text-sm text-text-muted">
                  No fee components added. Click &quot;Add Component&quot; to
                  start.
                </div>
              ) : (
                <div className="space-y-2">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-border-subtle p-3"
                    >
                      <div className="flex-1">
                        <Select
                          value={item.feeComponentId}
                          onValueChange={(value) =>
                            handleUpdateLineItem(
                              item.id,
                              "feeComponentId",
                              value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select component" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableComponents(item.id).map((comp) => (
                              <SelectItem key={comp.id} value={comp.id}>
                                {comp.name}
                              </SelectItem>
                            ))}
                            {/* Also show currently selected component */}
                            {item.feeComponentId &&
                              !getAvailableComponents(item.id).find(
                                (c) => c.id === item.feeComponentId,
                              ) && (
                                <SelectItem value={item.feeComponentId}>
                                  {feeComponents?.find(
                                    (c) => c.id === item.feeComponentId,
                                  )?.name ?? "Unknown"}
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={item.amount || ""}
                          onChange={(e) =>
                            handleUpdateLineItem(
                              item.id,
                              "amount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          min={0}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Amount Display */}
              {lineItems.length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-bg-subtle p-3">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-lg font-semibold text-primary-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || lineItems.length === 0}
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Update Structure"
                    : "Create Structure"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
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
 * Apply to Students Dialog
 * Allows applying a batch fee structure to all students in the batch
 */
function ApplyToStudentsDialog({
  open,
  onOpenChange,
  structure,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structure: BatchFeeStructure | null;
  onSuccess: () => void;
}) {
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply mutation
  const { mutate: applyStructure, isPending: isApplying } =
    useApplyBatchFeeStructure();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setOverwriteExisting(false);
        setError(null);
      });
    }
  }, [open]);

  // Handle apply action
  const handleApply = useCallback(() => {
    if (!structure) return;

    setError(null);

    applyStructure(
      {
        id: structure.id,
        overwriteExisting,
      },
      {
        onSuccess: (result) => {
          // Show success toast with counts
          if (result.applied > 0) {
            toast.success(
              `Applied fee structure to ${result.applied} student${result.applied !== 1 ? "s" : ""}${result.skipped > 0 ? `. ${result.skipped} skipped.` : ""}`,
            );
          } else if (result.skipped > 0) {
            toast.info(
              `No new fee structures created. ${result.skipped} student${result.skipped !== 1 ? "s" : ""} already had fee structures.`,
            );
          } else {
            toast.info("No students found in this batch.");
          }
          onSuccess();
        },
        onError: (err: unknown) => {
          const errorMessage =
            (err as { message?: string })?.message ??
            (err instanceof Error ? err.message : null) ??
            "Failed to apply fee structure";
          setError(errorMessage);
          toast.error(errorMessage);
        },
      },
    );
  }, [structure, overwriteExisting, applyStructure, onSuccess]);

  if (!structure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Fee Structure to Students</DialogTitle>
          <DialogDescription>
            Apply &quot;{structure.name}&quot; to all active students in{" "}
            {structure.batch.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Structure details */}
          <div className="rounded-lg bg-bg-subtle p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Batch:</span>
              <span className="font-medium">{structure.batch.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Session:</span>
              <span className="font-medium">{structure.session.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Amount:</span>
              <span className="font-medium text-primary-600">
                {formatCurrency(structure.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Components:</span>
              <span className="font-medium">
                {structure.lineItems?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Warning message */}
          <div className="callout-important">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Important</p>
              <p className="mt-1 text-xs opacity-90">
                This will create individual fee structures for all active
                students in this batch. Students who already have a fee
                structure for this session will be skipped unless you choose to
                overwrite.
              </p>
            </div>
          </div>

          {/* Overwrite checkbox */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="overwriteExisting"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <div>
                <Label
                  htmlFor="overwriteExisting"
                  className="text-sm font-medium cursor-pointer"
                >
                  Overwrite existing fee structures
                </Label>
                <p className="text-xs text-text-muted mt-0.5">
                  Replace fee structures for students who already have one for
                  this session
                </p>
              </div>
            </div>

            {/* Overwrite warning */}
            {overwriteExisting && (
              <div className="callout-warning ml-6">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  Warning: This will replace existing fee structures and may
                  affect any installments or payments already recorded.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? "Applying..." : "Apply to Students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
