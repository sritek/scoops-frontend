"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import {
  useReports,
  useReportTypes,
  useRequestReport,
  useDeleteReport,
  getReportDownloadUrl,
} from "@/lib/api";
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
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@/components/ui";
import type { Report, ReportType, ReportFormat } from "@/types/report";
import { PAGINATION_DEFAULTS } from "@/types";
import { useBatches } from "@/lib/api/batches";

/**
 * Reports Page
 */
export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { can } = usePermissions();

  const { data, isLoading } = useReports({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    status: statusFilter !== "__all__" ? (statusFilter as Report["status"]) : undefined,
    type: typeFilter !== "__all__" ? (typeFilter as ReportType) : undefined,
  });

  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const reports = data?.data ?? [];
  const pagination = data?.pagination;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "generating":
        return (
          <Badge variant="warning" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating
          </Badge>
        );
      default:
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getFormatIcon = (format: string) => {
    return format === "pdf" ? (
      <FileText className="h-4 w-4 text-red-500" />
    ) : (
      <FileSpreadsheet className="h-4 w-4 text-green-600" />
    );
  };

  const columns: ColumnDef<Report>[] = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Report Type",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getFormatIcon(row.original.format)}
            <span className="capitalize">
              {row.original.type.replace(/_/g, " ")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "format",
        header: "Format",
        cell: ({ row }) => (
          <Badge variant="default" className="uppercase">
            {row.original.format}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "requestedBy",
        header: "Requested By",
        cell: ({ row }) => row.original.requestedBy,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const report = row.original;
          return (
            <div className="flex items-center gap-2">
              {report.status === "completed" && (
                <a
                  href={getReportDownloadUrl(report.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {can("SETTINGS_MANAGE") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Delete this report?")) {
                      deleteReport(report.id);
                    }
                  }}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [can, deleteReport, isDeleting]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Reports</h1>
          <p className="text-sm text-text-muted">
            Generate and download attendance, fee, and performance reports
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            <SelectItem value="attendance_monthly">Monthly Attendance</SelectItem>
            <SelectItem value="attendance_batch">Batch Attendance</SelectItem>
            <SelectItem value="fee_collection">Fee Collection</SelectItem>
            <SelectItem value="fee_defaulters">Fee Defaulters</SelectItem>
            <SelectItem value="student_performance">Student Performance</SelectItem>
            <SelectItem value="branch_summary">Branch Summary</SelectItem>
          </SelectContent>
        </Select>

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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!isLoading && reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Generate your first report to get started"
            action={
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={reports}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No reports found."
          />
        </Card>
      )}

      {/* Request Report Dialog */}
      <RequestReportDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  );
}

/**
 * Request Report Dialog
 */
function RequestReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reportType, setReportType] = useState<ReportType>("attendance_monthly");
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [batchId, setBatchId] = useState("__all__");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: reportTypes } = useReportTypes();
  const { data: batches } = useBatches({ limit: 100 });
  const { mutate: requestReport, isPending } = useRequestReport();

  const selectedTypeInfo = reportTypes?.find((t) => t.type === reportType);
  const needsMonth = selectedTypeInfo?.parameters.includes("month");
  const needsBatch = selectedTypeInfo?.parameters.includes("batchId");
  const needsDates = selectedTypeInfo?.parameters.includes("startDate");

  const handleSubmit = () => {
    const parameters: Record<string, unknown> = {};
    
    if (needsMonth) {
      parameters.month = month;
      parameters.year = year;
    }
    if (needsBatch && batchId && batchId !== "__all__") {
      parameters.batchId = batchId;
    }
    if (needsDates) {
      if (startDate) parameters.startDate = startDate;
      if (endDate) parameters.endDate = endDate;
    }

    requestReport(
      { type: reportType, format, parameters },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setReportType("attendance_monthly");
          setFormat("pdf");
          setBatchId("__all__");
          setStartDate("");
          setEndDate("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Select the report type and parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes?.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTypeInfo && (
              <p className="text-xs text-text-muted">{selectedTypeInfo.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsMonth && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={month.toString()}
                  onValueChange={(v) => setMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={year.toString()}
                  onValueChange={(v) => setYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(5)].map((_, i) => {
                      const y = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {needsBatch && (
            <div className="space-y-2">
              <Label>Batch (optional)</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger>
                  <SelectValue placeholder="All batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All batches</SelectItem>
                  {batches?.data?.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsDates && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
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
    hour: "2-digit",
    minute: "2-digit",
  });
}
