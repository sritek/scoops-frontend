"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  Clock,
  User,
  Grid,
  CreditCard,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner,
} from "@/components/ui";
import {
  WeeklyScheduleGrid,
  CalendarScheduleView,
} from "@/components/batches";
import { useBatch } from "@/lib/api/batches";
import {
  useBatchSchedule,
  useDefaultPeriodTemplate,
} from "@/lib/api/schedule";
import { usePermissions } from "@/lib/hooks";
import { academicLevelLabels, streamLabels } from "@/types/batch";

/**
 * Batch Detail Page
 *
 * Shows batch information and schedule with tabs:
 * - Overview: Basic batch info
 * - Schedule: Weekly/Calendar schedule view
 */
export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState<"overview" | "schedule">(
    "overview"
  );
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  // Fetch data
  const { data: batchData, isLoading: batchLoading } = useBatch(batchId);
  const { data: schedule, isLoading: scheduleLoading } =
    useBatchSchedule(batchId);
  const { data: defaultTemplate } = useDefaultPeriodTemplate();

  const batch = batchData?.data;
  const canEdit = can("STUDENT_EDIT");

  // Use default template for slots and active days
  const { templateSlots, activeDays } = useMemo(() => {
    if (defaultTemplate) {
      return {
        templateSlots: defaultTemplate.slots,
        activeDays: defaultTemplate.activeDays || [1, 2, 3, 4, 5, 6],
      };
    }
    return { templateSlots: [], activeDays: [1, 2, 3, 4, 5, 6] };
  }, [defaultTemplate]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/batches">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text-primary">
                {batch.name}
              </h1>
              <Badge variant={batch.isActive ? "success" : "default"}>
                {batch.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-text-muted mt-1">
              {academicLevelLabels[batch.academicLevel]}
              {batch.stream && ` · ${streamLabels[batch.stream]}`}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link href={`/batches/${batchId}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/batches/${batchId}/fees`}>
                <CreditCard className="h-4 w-4 mr-1" />
                Fees
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/batches/${batchId}/schedule`}>
                <Calendar className="h-4 w-4 mr-1" />
                Manage Schedule
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{batch.studentCount}</p>
                <p className="text-xs text-text-muted">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {batch.periodCount || 0}
                </p>
                <p className="text-xs text-text-muted">Periods/Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <User className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium truncate">
                  {batch.classTeacher?.fullName || "—"}
                </p>
                <p className="text-xs text-text-muted">Class Teacher</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium truncate">
                  {batch.session?.name || "—"}
                </p>
                <p className="text-xs text-text-muted">Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "schedule"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Schedule
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-text-muted">Academic Level</dt>
                <dd className="text-sm font-medium">
                  {academicLevelLabels[batch.academicLevel]}
                </dd>
              </div>
              {batch.stream && (
                <div>
                  <dt className="text-xs text-text-muted">Stream</dt>
                  <dd className="text-sm font-medium">
                    {streamLabels[batch.stream]}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-text-muted">Class Teacher</dt>
                <dd className="text-sm font-medium">
                  {batch.classTeacher?.fullName || "Not assigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Academic Session</dt>
                <dd className="text-sm font-medium">
                  {batch.session?.name || "Not assigned"}
                  {batch.session?.isCurrent && (
                    <Badge variant="success" className="ml-2">
                      Current
                    </Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Created</dt>
                <dd className="text-sm font-medium">
                  {new Date(batch.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {activeTab === "schedule" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Schedule</CardTitle>
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
            </div>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : viewMode === "grid" ? (
              <WeeklyScheduleGrid
                periods={schedule || []}
                templateSlots={templateSlots}
                activeDays={activeDays}
                showBreaks
              />
            ) : (
              <CalendarScheduleView periods={schedule || []} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
