"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Search,
  AlertCircle,
  Filter,
  Clock,
  CalendarDays,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Coffee,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  useTodayAttendanceSummary,
  useUnmarkedStaff,
  useStaffAttendanceHistory,
  useMarkStaffAttendance,
  useStaffList,
} from "@/lib/api/staff";
import { usePermissions, useDebounce } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  DataTable,
  EmptyState,
  Input,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import type {
  StaffAttendanceRecord,
  StaffAttendanceStatus,
  LeaveType,
  UnmarkedStaff,
} from "@/types/staff";
import { PAGINATION_DEFAULTS } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ATTENDANCE_STATUSES: { value: StaffAttendanceStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "present", label: "Present", icon: CheckCircle2 },
  { value: "absent", label: "Absent", icon: XCircle },
  { value: "half_day", label: "Half Day", icon: MinusCircle },
  { value: "leave", label: "Leave", icon: Coffee },
];

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
];

function getStatusBadge(status: StaffAttendanceStatus) {
  const config = {
    present: { variant: "success" as const, icon: CheckCircle2 },
    absent: { variant: "error" as const, icon: XCircle },
    half_day: { variant: "warning" as const, icon: MinusCircle },
    leave: { variant: "info" as const, icon: Coffee },
  };
  const { variant, icon: Icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.replace("_", " ")}
    </Badge>
  );
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Staff Attendance Page
 *
 * Admin view for managing staff attendance.
 */
export default function StaffAttendancePage() {
  const { can } = usePermissions();
  const canManageUsers = can("USER_MANAGE");

  const [activeTab, setActiveTab] = useState("today");

  if (!canManageUsers) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Access Denied"
          description="You don't have permission to view staff attendance."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/staff">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Staff Attendance</h1>
          <p className="text-sm text-text-muted">Track and manage staff attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">Today&apos;s Summary</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <TodaySummaryTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>

        <TabsContent value="mark" className="mt-6">
          <MarkAttendanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Today's Summary Tab
 */
function TodaySummaryTab() {
  const { data: summary, isLoading, error } = useTodayAttendanceSummary();
  const { data: unmarkedStaff = [] } = useUnmarkedStaff();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">Failed to load today&apos;s summary.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-bg-app rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    { label: "Present", value: summary.stats.present, icon: UserCheck, color: "text-success" },
    { label: "Absent", value: summary.stats.absent, icon: UserX, color: "text-error" },
    { label: "Half Day", value: summary.stats.halfDay, icon: MinusCircle, color: "text-warning" },
    { label: "On Leave", value: summary.stats.leave, icon: Coffee, color: "text-info" },
    { label: "Not Marked", value: summary.stats.notMarked, icon: Clock, color: "text-text-muted" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unmarked Staff Alert */}
      {unmarkedStaff.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              {unmarkedStaff.length} staff member(s) haven&apos;t marked attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unmarkedStaff.map((staff: UnmarkedStaff) => (
                <Badge key={staff.id} variant="default" className="bg-amber-100 text-amber-800">
                  {staff.fullName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Attendance ({summary.date})</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.attendance.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No attendance marked yet"
              description="Staff attendance for today will appear here"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Staff</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Check In</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Check Out</th>
                    <th className="text-left py-2 px-3 font-medium hidden lg:table-cell">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.attendance.map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium">{record.user.fullName}</p>
                          <p className="text-xs text-text-muted">{record.user.department || record.user.role}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3">{getStatusBadge(record.status)}</td>
                      <td className="py-3 px-3 hidden md:table-cell">{formatTime(record.checkIn)}</td>
                      <td className="py-3 px-3 hidden md:table-cell">{formatTime(record.checkOut)}</td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        {record.hoursWorked ? `${record.hoursWorked}h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * History Tab
 */
function HistoryTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const debouncedDate = useDebounce(dateFilter, 300);

  const { data, isLoading, error } = useStaffAttendanceHistory({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    startDate: debouncedDate || undefined,
    endDate: debouncedDate || undefined,
    status: (statusFilter as StaffAttendanceStatus) || undefined,
  });

  const records = data?.data ?? [];
  const pagination = data?.pagination;

  const columns: ColumnDef<StaffAttendanceRecord>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
            <span>{formatDate(row.original.date)}</span>
          </div>
        ),
      },
      {
        accessorKey: "user.fullName",
        header: "Staff",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.user.fullName}</p>
            <p className="text-xs text-text-muted">{row.original.user.employeeId}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "checkIn",
        header: "Check In",
        cell: ({ row }) => formatTime(row.original.checkIn),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "checkOut",
        header: "Check Out",
        cell: ({ row }) => formatTime(row.original.checkOut),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "hoursWorked",
        header: "Hours",
        cell: ({ row }) =>
          row.original.hoursWorked ? `${row.original.hoursWorked}h` : "—",
        meta: {
          headerClassName: "hidden lg:table-cell",
          cellClassName: "hidden lg:table-cell",
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
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

        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {ATTENDANCE_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">Failed to load attendance history.</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!error && (
        <Card>
          <DataTable
            columns={columns}
            data={records}
            paginationMode="server"
            serverPagination={pagination}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            pageSize={PAGINATION_DEFAULTS.LIMIT}
            emptyMessage="No attendance records found."
          />
        </Card>
      )}
    </div>
  );
}

/**
 * Mark Attendance Tab
 */
function MarkAttendanceTab() {
  const [selectedStaff, setSelectedStaff] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<StaffAttendanceStatus>("present");
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: staffData } = useStaffList({
    page: 1,
    limit: 100,
    search: debouncedSearch || undefined,
    isActive: true,
  });

  const staffList = staffData?.data ?? [];

  const { mutate: markAttendance, isPending, error, isSuccess } = useMarkStaffAttendance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !date || !status) return;

    markAttendance(
      {
        userId: selectedStaff,
        date,
        status,
        leaveType: status === "leave" ? (leaveType as LeaveType) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setSelectedStaff("");
          setStatus("present");
          setLeaveType("");
          setNotes("");
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mark Attendance Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-error">
              {error instanceof Error ? error.message : "Failed to mark attendance"}
            </div>
          )}

          {isSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-success">
              Attendance marked successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="staffSearch">Search Staff</Label>
            <Input
              id="staffSearch"
              type="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff">Select Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger id="staff">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName} ({s.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StaffAttendanceStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "leave" && (
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                value={leaveType}
                onValueChange={(v) => setLeaveType(v as LeaveType)}
              >
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>

          <Button type="submit" disabled={isPending || !selectedStaff}>
            {isPending ? "Marking..." : "Mark Attendance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
