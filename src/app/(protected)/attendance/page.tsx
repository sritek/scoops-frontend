"use client";

import { useState } from "react";
import { ClipboardCheck, LayoutDashboard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/components/attendance/dashboardTab";
import { MarkAttendanceTab } from "@/components/attendance/mark-attendanceTab";
import { HistoryTab } from "@/components/attendance/historyTab";

type TabId = "dashboard" | "mark" | "history";

/**
 * Attendance Page with Tabs
 *
 * Modern, interactive UI for attendance management:
 * - Dashboard: Today's overview with stats and batch status
 * - Mark Attendance: Mark daily attendance for batches
 * - History: Browse and view past attendance records
 */
export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [chosenBatchId, setChosenBatchId] = useState<string | null>(null);

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "mark" as const, label: "Mark Attendance", icon: ClipboardCheck },
    { id: "history" as const, label: "History", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Attendance</h1>
        <p className="text-sm text-text-muted">
          Track and manage student attendance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-bg-app p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <DashboardTab
          onMarkAttendance={(batchId: string | null) => {
            setActiveTab("mark");
            setChosenBatchId(batchId);
          }}
        />
      )}
      {activeTab === "mark" && <MarkAttendanceTab batchId={chosenBatchId} />}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
