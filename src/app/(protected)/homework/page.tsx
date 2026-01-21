"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  BookOpen,
  Calendar,
  Award,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  Users,
  AlertTriangle,
  FileText,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
} from "@/components/ui";
import { toast } from "sonner";
import {
  useHomeworkList,
  useHomeworkStats,
  useCreateHomework,
  useUpdateHomework,
  useDeleteHomework,
  usePublishHomework,
  useCloseHomework,
  type HomeworkListItem,
  type HomeworkStatus,
  type CreateHomeworkInput,
} from "@/lib/api/homework";
import { useQuery as useQueryBatches } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: HomeworkStatus) {
  switch (status) {
    case "draft":
      return {
        label: "Draft",
        color: "bg-gray-100 text-gray-700",
        icon: FileText,
      };
    case "published":
      return {
        label: "Published",
        color: "bg-green-100 text-green-700",
        icon: Send,
      };
    case "closed":
      return {
        label: "Closed",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        color: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
}

/**
 * Create homework schema
 */
const createHomeworkSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  subjectId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().min(1, "Due date is required"),
  totalMarks: z.coerce.number().optional(),
});

type CreateHomeworkForm = z.infer<typeof createHomeworkSchema>;

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-muted">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Homework Card Component
 */
function HomeworkCard({
  homework,
  onEdit,
  onPublish,
  onClose,
  onDelete,
}: {
  homework: HomeworkListItem;
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const statusConfig = getStatusConfig(homework.status);
  const StatusIcon = statusConfig.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action menu
    if ((e.target as HTMLElement).closest("[data-action-menu]")) return;
    router.push(`/homework/${homework.id}`);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        homework.isOverdue && homework.status === "published" && "border-orange-200"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title and Batch/Subject */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text-primary truncate">
                {homework.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {homework.batchName}
              </Badge>
              {homework.subjectName && (
                <Badge variant="outline" className="text-xs bg-purple-50">
                  {homework.subjectName}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-text-muted line-clamp-2 mb-3">
              {homework.description}
            </p>

            {/* Due Date and Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                Due: {formatDate(homework.dueDate)}
              </span>
              {homework.totalMarks && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Award className="h-3.5 w-3.5" />
                  {homework.totalMarks} marks
                </span>
              )}
              {homework.status !== "draft" && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {homework.submissionCount} submissions
                </span>
              )}
            </div>

            {/* Overdue indicator */}
            {homework.isOverdue && homework.status === "published" && (
              <div className="flex items-center gap-1.5 mt-2 text-orange-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs">Past due date</span>
              </div>
            )}
          </div>

          {/* Status Badge and Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild data-action-menu>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {homework.status === "draft" && (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onPublish}>
                      <Send className="h-4 w-4 mr-2" />
                      Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {homework.status === "published" && (
                  <DropdownMenuItem onClick={onClose}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Close
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Create/Edit Homework Dialog
 */
function HomeworkFormDialog({
  open,
  onOpenChange,
  homework,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework?: HomeworkListItem | null;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreateHomework();
  const updateMutation = useUpdateHomework();

  // Fetch batches
  const { data: batchesData } = useQuery({
    queryKey: ["batches"],
    queryFn: () => apiClient.get<{ data: Array<{ id: string; name: string }> }>("/batches"),
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => apiClient.get<{ data: Array<{ id: string; name: string }> }>("/subjects"),
  });

  const form = useForm<CreateHomeworkForm>({
    resolver: zodResolver(createHomeworkSchema),
    defaultValues: {
      batchId: homework?.batchId ?? "",
      subjectId: homework?.subjectId ?? "",
      title: homework?.title ?? "",
      description: homework?.description ?? "",
      dueDate: homework?.dueDate ?? "",
      totalMarks: homework?.totalMarks ?? undefined,
    },
  });

  const onSubmit = async (data: CreateHomeworkForm) => {
    try {
      const input: CreateHomeworkInput = {
        batchId: data.batchId,
        subjectId: data.subjectId || null,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        totalMarks: data.totalMarks || null,
      };

      if (homework) {
        await updateMutation.mutateAsync({ id: homework.id, input });
        toast.success("Homework updated successfully");
      } else {
        await createMutation.mutateAsync(input);
        toast.success("Homework created successfully");
      }
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error("Failed to save homework");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{homework ? "Edit Homework" : "Create Homework"}</DialogTitle>
          <DialogDescription>
            {homework
              ? "Update homework details"
              : "Create a new homework assignment"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch *</Label>
            <Select
              value={form.watch("batchId")}
              onValueChange={(value) => form.setValue("batchId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batchesData?.data?.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.batchId && (
              <p className="text-xs text-error">{form.formState.errors.batchId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectId">Subject (Optional)</Label>
            <Select
              value={form.watch("subjectId") || ""}
              onValueChange={(value) => form.setValue("subjectId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No subject</SelectItem>
                {subjectsData?.data?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Homework title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-error">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Homework instructions..."
              rows={4}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-error">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-xs text-error">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                placeholder="100"
                {...form.register("totalMarks")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {homework ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Staff Homework Page
 */
export default function StaffHomeworkPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<HomeworkStatus | "all">("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editHomework, setEditHomework] = useState<HomeworkListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch batches for filter
  const { data: batchesData } = useQuery({
    queryKey: ["batches"],
    queryFn: () => apiClient.get<{ data: Array<{ id: string; name: string }> }>("/batches"),
  });

  // Fetch homework stats
  const { data: stats } = useHomeworkStats();

  // Fetch homework list
  const { data, isLoading, error } = useHomeworkList({
    page,
    limit: 10,
    status: statusFilter !== "all" ? statusFilter : undefined,
    batchId: batchFilter !== "all" ? batchFilter : undefined,
  });

  // Mutations
  const publishMutation = usePublishHomework();
  const closeMutation = useCloseHomework();
  const deleteMutation = useDeleteHomework();

  const handlePublish = async (id: string) => {
    try {
      const result = await publishMutation.mutateAsync(id);
      toast.success(`Homework published to ${result.studentCount} students`);
    } catch {
      toast.error("Failed to publish homework");
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeMutation.mutateAsync(id);
      toast.success("Homework closed");
    } catch {
      toast.error("Failed to close homework");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Homework deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete homework");
    }
  };

  const homework = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Homework
          </h1>
          <p className="text-text-muted">Manage homework assignments</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Homework
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Active"
            value={stats.totalActive}
            icon={CheckCircle}
            color="bg-green-100 text-green-700"
          />
          <StatCard
            title="Due Soon (7 days)"
            value={stats.dueSoon}
            icon={Clock}
            color="bg-yellow-100 text-yellow-700"
          />
          <StatCard
            title="Pending Grading"
            value={stats.pendingGrading}
            icon={Award}
            color="bg-blue-100 text-blue-700"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={batchFilter}
          onValueChange={(value) => {
            setBatchFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batchesData?.data?.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as HomeworkStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-error">Failed to load homework</p>
          </CardContent>
        </Card>
      )}

      {/* Homework List */}
      {!isLoading && !error && (
        <>
          {homework.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-text-muted" />
                <p className="text-text-muted">No homework found</p>
                <Button
                  className="mt-4"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Homework
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {homework.map((hw) => (
                <HomeworkCard
                  key={hw.id}
                  homework={hw}
                  onEdit={() => setEditHomework(hw)}
                  onPublish={() => handlePublish(hw.id)}
                  onClose={() => handleClose(hw.id)}
                  onDelete={() => setDeleteId(hw.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <HomeworkFormDialog
        open={createDialogOpen || !!editHomework}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditHomework(null);
          }
        }}
        homework={editHomework}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Homework</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this homework? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
