"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Plus,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  useComplaints,
  useComplaintStats,
  useCreateComplaint,
} from "@/lib/api/complaints";
import { useStudents } from "@/lib/api/students";
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
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  CreateComplaintInput,
} from "@/types/complaint";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  COMPLAINT_PRIORITIES,
} from "@/types/complaint";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Complaints Page
 */
export default function ComplaintsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [priorityFilter, setPriorityFilter] = useState<string>("__all__");
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { can } = usePermissions();

  const canManageComplaints = can("SETTINGS_MANAGE");

  const { data, isLoading, error } = useComplaints({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    status: statusFilter !== "__all__" ? (statusFilter as ComplaintStatus) : undefined,
    priority: priorityFilter !== "__all__" ? (priorityFilter as ComplaintPriority) : undefined,
    category: categoryFilter !== "__all__" ? categoryFilter : undefined,
  });

  const { data: stats } = useComplaintStats();

  const complaints = data?.data ?? [];
  const pagination = data?.pagination;

  const getStatusBadge = (status: ComplaintStatus) => {
    const config = {
      open: { variant: "warning" as const, icon: Clock },
      in_progress: { variant: "info" as const, icon: Loader2 },
      resolved: { variant: "success" as const, icon: CheckCircle },
      closed: { variant: "default" as const, icon: XCircle },
    };
    const { variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1 capitalize">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    const config = {
      low: "default" as const,
      medium: "warning" as const,
      high: "error" as const,
      urgent: "error" as const,
    };
    return (
      <Badge variant={config[priority]} className="capitalize">
        {priority}
      </Badge>
    );
  };

  const columns: ColumnDef<Complaint>[] = useMemo(
    () => [
      {
        accessorKey: "ticketNumber",
        header: "Ticket",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ticketNumber}</span>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.subject}</p>
            <p className="text-xs text-text-muted capitalize">
              {row.original.category}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => getPriorityBadge(row.original.priority),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "submittedBy",
        header: "Submitted By",
        cell: ({ row }) => row.original.submittedBy,
      },
      {
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => row.original.assignedTo || "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/complaints/${row.original.id}`)}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {row.original.commentCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <MessageSquare className="h-3 w-3" />
                {row.original.commentCount}
              </span>
            )}
          </div>
        ),
      },
    ],
    [router]
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader onCreateClick={() => setShowCreateDialog(true)} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load complaints. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader onCreateClick={() => setShowCreateDialog(true)} />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Open"
            value={stats.byStatus?.open || 0}
            variant="warning"
          />
          <StatCard
            label="In Progress"
            value={stats.byStatus?.in_progress || 0}
            variant="info"
          />
          <StatCard
            label="Resolved"
            value={stats.byStatus?.resolved || 0}
            variant="success"
          />
          <StatCard
            label="Total"
            value={stats.total}
            variant="default"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            {COMPLAINT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All priority</SelectItem>
            {COMPLAINT_PRIORITIES.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {COMPLAINT_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!isLoading && complaints.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="No complaints"
            description="No complaints have been submitted yet"
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Complaint
              </Button>
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={complaints}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No complaints found."
          />
        </Card>
      )}

      {/* Create Complaint Dialog */}
      <CreateComplaintDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

/**
 * Page Header
 */
function PageHeader({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Complaints</h1>
        <p className="text-sm text-text-muted">
          Manage and track complaints and support tickets
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        New Complaint
      </Button>
    </div>
  );
}

/**
 * Stat Card
 */
function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "info";
}) {
  const variantStyles = {
    default: "text-text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-primary-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-text-muted">{label}</p>
        <p className={`text-2xl font-bold ${variantStyles[variant]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Create Complaint Dialog
 */
function CreateComplaintDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CreateComplaintInput>>({
    priority: "medium",
    category: "other",
  });

  const { data: studentsData } = useStudents({ limit: 100 });
  const { mutate: createComplaint, isPending } = useCreateComplaint();

  const students = studentsData?.data ?? [];

  const handleSubmit = () => {
    if (!formData.subject || !formData.description || !formData.category) {
      return;
    }

    createComplaint(formData as CreateComplaintInput, {
      onSuccess: (complaint) => {
        onOpenChange(false);
        setFormData({ priority: "medium", category: "other" });
        router.push(`/complaints/${complaint.id}`);
      },
    });
  };

  const updateField = <K extends keyof CreateComplaintInput>(
    field: K,
    value: CreateComplaintInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Complaint</DialogTitle>
          <DialogDescription>
            Submit a new complaint or support ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject ?? ""}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category ?? "other"}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority ?? "medium"}
                onValueChange={(v) =>
                  updateField("priority", v as ComplaintPriority)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Related Student (optional)</Label>
            <Select
              value={formData.studentId ?? "__none__"}
              onValueChange={(v) => updateField("studentId", v === "__none__" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Detailed description of the complaint..."
              className="w-full min-h-[120px] rounded-md border border-border-subtle bg-surface-primary px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !formData.subject ||
              !formData.description ||
              !formData.category ||
              isPending
            }
          >
            {isPending ? "Creating..." : "Create Complaint"}
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
