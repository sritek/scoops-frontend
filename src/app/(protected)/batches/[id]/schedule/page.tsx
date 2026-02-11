"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Grid,
  Calendar,
  Settings,
  Save,
  RotateCcw,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import {
  WeeklyScheduleGrid,
  CalendarScheduleView,
  TeacherAssignmentPanel,
  PeriodTemplateEditor,
} from "@/components/batches";
import { useBatch } from "@/lib/api/batches";
import {
  useBatchSchedule,
  useSetBatchSchedule,
  useUpdatePeriod,
  useInitializeSchedule,
  useAllPeriodTemplates,
  useDefaultPeriodTemplate,
} from "@/lib/api/schedule";
import { useOrganization } from "@/lib/api/settings";
import { usePermissions } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { AccessDeniedPage } from "@/components/ui";
import type {
  Period,
  PeriodInput,
  UpdatePeriodInput,
  PeriodTemplateSlot,
} from "@/types/schedule";
import { DAYS_OF_WEEK } from "@/types/schedule";

/**
 * Schedule Management Page
 *
 * Full page for managing batch schedule:
 * - Initialize from template
 * - Edit periods individually
 * - View in grid or calendar mode
 * - Bulk operations
 */
export default function ScheduleManagementPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { can } = usePermissions();

  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [selectedPeriod, setSelectedPeriod] = useState<{
    day: number;
    period: number;
  } | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  // Fetch data
  const { data: batchData, isLoading: batchLoading } = useBatch(batchId);
  const { data: orgData } = useOrganization();
  const {
    data: schedule,
    isLoading: scheduleLoading,
    refetch: refetchSchedule,
  } = useBatchSchedule(batchId);
  const { data: templates } = useAllPeriodTemplates();
  const { data: defaultTemplate } = useDefaultPeriodTemplate();

  const organization = orgData?.data;

  // Mutations
  const { mutate: updatePeriod, isPending: isUpdatingPeriod } =
    useUpdatePeriod();
  const { mutate: initSchedule, isPending: isInitializing } =
    useInitializeSchedule();
  const { mutate: setSchedule, isPending: isSettingSchedule } =
    useSetBatchSchedule();

  const batch = batchData?.data;
  const canEdit = can("STUDENT_EDIT");

  // Use default template for slots and active days, or derive from schedule
  const { templateSlots, activeDays } = useMemo(() => {
    // If we have a default template, use its slots (includes breaks) and activeDays
    if (defaultTemplate) {
      return {
        templateSlots: defaultTemplate.slots,
        activeDays: defaultTemplate.activeDays || [1, 2, 3, 4, 5, 6],
      };
    }

    // Otherwise derive from schedule
    if (!schedule || schedule.length === 0) {
      return { templateSlots: [], activeDays: [1, 2, 3, 4, 5, 6] };
    }

    // Get unique period numbers and times from Monday
    const mondayPeriods = schedule.filter((p) => p.dayOfWeek === 1);
    const slots = mondayPeriods.map((p) => ({
      id: `slot-${p.periodNumber}`,
      templateId: "",
      periodNumber: p.periodNumber,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak: false,
    }));

    // Derive active days from schedule
    const daysInSchedule = new Set(schedule.map((p) => p.dayOfWeek));

    return {
      templateSlots: slots,
      activeDays: Array.from(daysInSchedule).sort((a, b) => a - b),
    };
  }, [schedule, defaultTemplate]);

  if (!canEdit) {
    return <AccessDeniedPage />;
  }

  // Handle period click in schedule
  const handlePeriodClick = (day: number, periodNumber: number) => {
    setSelectedPeriod({ day, period: periodNumber });
  };

  // Handle period update
  const handlePeriodSave = (data: UpdatePeriodInput) => {
    if (!selectedPeriod) return;

    updatePeriod(
      {
        batchId,
        day: selectedPeriod.day,
        period: selectedPeriod.period,
        data,
      },
      {
        onSuccess: () => {
          toast.success("Period updated");
          setSelectedPeriod(null);
        },
        onError: () => {
          toast.error("Failed to update period");
        },
      }
    );
  };

  // Initialize schedule from template
  const handleInitSchedule = (templateId: string) => {
    initSchedule(
      { batchId, templateId },
      {
        onSuccess: () => {
          toast.success("Schedule initialized from template");
          setShowTemplateDialog(false);
        },
        onError: () => {
          toast.error("Failed to initialize schedule");
        },
      }
    );
  };

  // Get selected period data
  const getSelectedPeriodData = (): Period | null => {
    if (!selectedPeriod || !schedule) return null;
    return (
      schedule.find(
        (p) =>
          p.dayOfWeek === selectedPeriod.day &&
          p.periodNumber === selectedPeriod.period
      ) || null
    );
  };

  // Clear all periods (reset schedule) after user confirms in dialog
  const handleConfirmClearSchedule = () => {
    setSchedule(
      { batchId, periods: [] },
      {
        onSuccess: () => {
          toast.success("Schedule cleared");
          setShowClearDialog(false);
        },
        onError: () => {
          toast.error("Failed to clear schedule");
        },
      }
    );
  };

  if (batchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Batch not found</p>
        <Button asChild className="mt-4">
          <Link href="/batches">Back to Batches</Link>
        </Button>
      </div>
    );
  }

  const scheduleDateLabel = batch
    ? new Date(batch.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div>
      {/* Screen-only: full schedule management UI */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Schedule Management
            </h1>
            <p className="text-sm text-text-muted mt-1">{batch.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-bg-app rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "calendar" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>

          {/* Print button */}
          {schedule && schedule.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="print:hidden"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          )}

          {/* Template dialog */}
          <Dialog
            open={showTemplateDialog}
            onOpenChange={(open) => {
              setShowTemplateDialog(open);
              if (!open) setSelectedTemplateId(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Settings className="h-4 w-4 mr-1" />
                Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Initialize from Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-text-muted">
                  Choose a period template to initialize the schedule. This will
                  replace any existing schedule.
                </p>
                <div className="space-y-2">
                  {templates?.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      disabled={isInitializing}
                      aria-selected={selectedTemplateId === template.id}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all cursor-pointer",
                        selectedTemplateId === template.id
                          ? "border-primary-600 bg-primary-100/30 ring-1 ring-primary-600/50"
                          : "border-border-subtle hover:border-primary-600 hover:bg-primary-100/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{template.name}</span>
                        {template.isDefault && (
                          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        {template.slots.filter((s) => !s.isBreak).length}{" "}
                        periods
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowTemplateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={selectedTemplateId == null || isInitializing}
                  onClick={() => {
                    if (selectedTemplateId) handleInitSchedule(selectedTemplateId);
                  }}
                >
                  {isInitializing ? "Applying..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clear schedule confirmation dialog */}
          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Clear schedule?</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-text-muted">
                  Are you sure you want to clear all periods? This cannot be
                  undone.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowClearDialog(false)}
                  disabled={isSettingSchedule}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmClearSchedule}
                  disabled={isSettingSchedule}
                  className="bg-error text-white hover:bg-error/90"
                >
                  Clear all periods
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear schedule */}
          {schedule && schedule.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowClearDialog(true)}
              disabled={isSettingSchedule}
              className="text-error hover:text-error hover:bg-error/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule view */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {viewMode === "grid" ? "Weekly Schedule" : "Calendar View"}
                </CardTitle>
                <span className="text-sm text-text-muted">
                  Click a period to edit
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : schedule && schedule.length > 0 ? (
                viewMode === "grid" ? (
                  <WeeklyScheduleGrid
                    periods={schedule}
                    templateSlots={templateSlots}
                    activeDays={activeDays}
                    onPeriodClick={handlePeriodClick}
                    selectedPeriod={selectedPeriod}
                    editable
                    showTeacher
                    showBreaks
                  />
                ) : (
                  <CalendarScheduleView
                    periods={schedule}
                    onPeriodClick={(period) =>
                      handlePeriodClick(period.dayOfWeek, period.periodNumber)
                    }
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">
                    No schedule configured yet.
                  </p>
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    Initialize from Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment panel */}
        <div className="lg:col-span-1">
          {selectedPeriod ? (
            <TeacherAssignmentPanel
              period={getSelectedPeriodData()}
              day={selectedPeriod.day}
              periodNumber={selectedPeriod.period}
              startTime={getSelectedPeriodData()?.startTime || "08:00"}
              endTime={getSelectedPeriodData()?.endTime || "08:45"}
              onSave={handlePeriodSave}
              onClose={() => setSelectedPeriod(null)}
              isLoading={isUpdatingPeriod}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-text-muted">
                <Settings className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Select a period from the schedule to assign subject and
                  teacher.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {/* Print-only: single-page schedule with header */}
      <div className="schedule-print-view hidden print:block">
        <div className="text-center mb-4">
          <h1 className="text-lg font-semibold text-black">
            {organization?.name ?? "School"}
          </h1>
        </div>
        <div className="flex justify-between items-center mb-4 px-8 text-sm text-black">
          <span>{batch.name}</span>
          <span>{scheduleDateLabel}</span>
        </div>
        {schedule && schedule.length > 0 ? (
          <WeeklyScheduleGrid
            periods={schedule}
            templateSlots={templateSlots}
            activeDays={activeDays}
            editable={false}
            showTeacher
            showBreaks
          />
        ) : (
          <p className="text-center text-black py-8">No schedule configured.</p>
        )}
      </div>
    </div>
  );
}
