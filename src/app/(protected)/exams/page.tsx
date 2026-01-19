"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  GraduationCap,
  Plus,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ClipboardList,
} from "lucide-react";
import {
  useExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
} from "@/lib/api/exams";
import { useBatches } from "@/lib/api/batches";
import { useAllSubjects } from "@/lib/api/subjects";
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
import type { Exam, ExamType, CreateExamInput } from "@/types/exam";
import { PAGINATION_DEFAULTS } from "@/types";

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "unit_test", label: "Unit Test" },
  { value: "mid_term", label: "Mid-Term" },
  { value: "final", label: "Final" },
  { value: "practical", label: "Practical" },
  { value: "assignment", label: "Assignment" },
];

/**
 * Exams Management Page
 */
export default function ExamsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [batchFilter, setBatchFilter] = useState<string>("__all__");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { can } = usePermissions();

  const canManageExams = can("ATTENDANCE_MARK"); // Teachers can manage exams
  const canDeleteExams = can("SETTINGS_MANAGE");

  const { data, isLoading, error } = useExams({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    batchId: batchFilter !== "__all__" ? batchFilter : undefined,
    type: typeFilter !== "__all__" ? (typeFilter as ExamType) : undefined,
  });

  const { data: batchesData } = useBatches({ limit: 100 });
  const { mutate: updateExam } = useUpdateExam();
  const { mutate: deleteExam, isPending: isDeleting } = useDeleteExam();

  const exams = data?.data ?? [];
  const pagination = data?.pagination;
  const batches = batchesData?.data ?? [];

  const handleTogglePublish = (exam: Exam) => {
    updateExam({
      id: exam.id,
      data: { isPublished: !exam.isPublished },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this exam? All scores will be lost.")) {
      deleteExam(id);
    }
  };

  const columns: ColumnDef<Exam>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Exam Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-text-muted">{row.original.batchName}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="default" className="capitalize">
            {row.original.type.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "subjectName",
        header: "Subject",
        cell: ({ row }) => row.original.subjectName || "—",
      },
      {
        accessorKey: "totalMarks",
        header: "Marks",
        cell: ({ row }) => (
          <span>
            {row.original.passingMarks}/{row.original.totalMarks}
          </span>
        ),
      },
      {
        accessorKey: "examDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.examDate),
      },
      {
        accessorKey: "scoresCount",
        header: "Scores",
        cell: ({ row }) => (
          <span className="text-text-muted">{row.original.scoresCount} entered</span>
        ),
      },
      {
        accessorKey: "isPublished",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isPublished ? "success" : "warning"}>
            {row.original.isPublished ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/exams/${row.original.id}`)}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canManageExams && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/exams/${row.original.id}/marks`)}
                  title="Enter marks"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePublish(row.original)}
                  title={row.original.isPublished ? "Unpublish" : "Publish"}
                >
                  {row.original.isPublished ? (
                    <XCircle className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-success" />
                  )}
                </Button>
              </>
            )}
            {canDeleteExams && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row.original.id)}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [router, canManageExams, canDeleteExams, isDeleting, updateExam]
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader canManageExams={canManageExams} onCreateClick={() => setShowCreateDialog(true)} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">Failed to load exams. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader canManageExams={canManageExams} onCreateClick={() => setShowCreateDialog(true)} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={batchFilter}
          onValueChange={(value) => {
            setBatchFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
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

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {EXAM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!isLoading && exams.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="No exams yet"
            description="Create your first exam to start tracking student performance"
            action={
              canManageExams ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card>
          <DataTable
            columns={columns}
            data={exams}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No exams found."
          />
        </Card>
      )}

      {/* Create Exam Dialog */}
      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        batches={batches}
      />
    </div>
  );
}

/**
 * Page Header
 */
function PageHeader({
  canManageExams,
  onCreateClick,
}: {
  canManageExams: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Exams</h1>
        <p className="text-sm text-text-muted">
          Manage exams and track student performance
        </p>
      </div>
      {canManageExams && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      )}
    </div>
  );
}

/**
 * Create Exam Dialog
 */
function CreateExamDialog({
  open,
  onOpenChange,
  batches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CreateExamInput>>({
    type: "unit_test",
    totalMarks: 100,
    passingMarks: 35,
  });

  const { data: subjectsData } = useAllSubjects();
  const { mutate: createExam, isPending } = useCreateExam();

  const subjects = subjectsData ?? [];

  const handleSubmit = () => {
    if (!formData.batchId || !formData.name || !formData.examDate) {
      return;
    }

    createExam(formData as CreateExamInput, {
      onSuccess: (exam) => {
        onOpenChange(false);
        setFormData({
          type: "unit_test",
          totalMarks: 100,
          passingMarks: 35,
        });
        // Navigate to marks entry page
        router.push(`/exams/${exam.id}/marks`);
      },
    });
  };

  const updateField = <K extends keyof CreateExamInput>(
    field: K,
    value: CreateExamInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
          <DialogDescription>
            Create a new exam for a batch. You can enter marks after creating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="batch">Batch *</Label>
            <Select
              value={formData.batchId ?? ""}
              onValueChange={(v) => updateField("batchId", v)}
            >
              <SelectTrigger id="batch">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Exam Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Unit Test 1, Mid-Term Exam"
              value={formData.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type ?? "unit_test"}
                onValueChange={(v) => updateField("type", v as ExamType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Select
                value={formData.subjectId ?? "__none__"}
                onValueChange={(v) => updateField("subjectId", v === "__none__" ? undefined : v)}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                value={formData.totalMarks ?? ""}
                onChange={(e) => updateField("totalMarks", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingMarks">Passing Marks *</Label>
              <Input
                id="passingMarks"
                type="number"
                value={formData.passingMarks ?? ""}
                onChange={(e) => updateField("passingMarks", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Exam Date *</Label>
            <Input
              id="examDate"
              type="date"
              value={formData.examDate ?? ""}
              onChange={(e) => updateField("examDate", e.target.value)}
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
              !formData.batchId ||
              !formData.name ||
              !formData.examDate ||
              !formData.totalMarks ||
              !formData.passingMarks ||
              isPending
            }
          >
            {isPending ? "Creating..." : "Create & Enter Marks"}
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
