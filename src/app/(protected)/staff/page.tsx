"use client";

import { useState, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Search,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Edit,
  Calendar,
  Building,
  Briefcase,
} from "lucide-react";
import {
  useStaffList,
  useDepartments,
  useUpdateStaffProfile,
} from "@/lib/api/staff";
import { usePermissions, useDebounce } from "@/lib/hooks";
import {
  Button,
  Card,
  CardContent,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui";
import type { StaffEntity, EmploymentType, UpdateStaffProfileInput } from "@/types/staff";
import type { UserRole } from "@/types/user";
import { PAGINATION_DEFAULTS } from "@/types";
import Link from "next/link";

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "accounts", label: "Accounts" },
  { value: "staff", label: "Staff" },
];

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
];

function formatEmploymentType(type: EmploymentType | null): string {
  if (!type) return "—";
  return EMPLOYMENT_TYPES.find((t) => t.value === type)?.label || type;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Staff Directory Page
 *
 * Displays staff members with profile management capabilities.
 */
export default function StaffPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [editingStaff, setEditingStaff] = useState<StaffEntity | null>(null);

  const { can } = usePermissions();
  const canManageUsers = can("USER_MANAGE");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = useStaffList({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    search: debouncedSearch || undefined,
    role: (roleFilter as UserRole) || undefined,
    department: departmentFilter || undefined,
  });

  const { data: departments = [] } = useDepartments();

  const staff = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const handleDepartmentChange = useCallback((value: string) => {
    setDepartmentFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<StaffEntity>[] = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div>
              <p className="font-medium">{s.fullName}</p>
              <p className="text-xs text-text-muted">{s.employeeId}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="info" className="capitalize">
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-text-muted" />
            <span>{row.original.department || "—"}</span>
          </div>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "designation",
        header: "Designation",
        cell: ({ row }) => row.original.designation || "—",
        meta: {
          headerClassName: "hidden lg:table-cell",
          cellClassName: "hidden lg:table-cell",
        },
      },
      {
        accessorKey: "employmentType",
        header: "Type",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-text-muted" />
            <span>{formatEmploymentType(row.original.employmentType)}</span>
          </div>
        ),
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone,
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
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManageUsers ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingStaff(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [canManageUsers]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Staff Directory</h1>
          <p className="text-sm text-text-muted">View and manage staff profiles</p>
        </div>

        {canManageUsers && (
          <Link href="/staff/attendance">
            <Button variant="secondary">
              <Calendar className="mr-2 h-4 w-4" />
              Staff Attendance
            </Button>
          </Link>
        )}
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
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search staff"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <Select value={roleFilter || "all"} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {departments.length > 0 && (
            <Select value={departmentFilter || "all"} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Depts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load staff. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      {!error && (
        <>
          {!isLoading && staff.length === 0 && !searchQuery && !roleFilter && !departmentFilter ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No staff members yet"
                description="Staff members will appear here once added to the system"
              />
            </Card>
          ) : !isLoading && staff.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No staff found"
                description="Try adjusting your search or filters"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("");
                      setDepartmentFilter("");
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
                data={staff}
                paginationMode="server"
                serverPagination={pagination}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                pageSize={PAGINATION_DEFAULTS.LIMIT}
                emptyMessage="No staff found."
              />
            </Card>
          )}
        </>
      )}

      {/* Edit Staff Profile Dialog */}
      <EditStaffProfileDialog
        staff={editingStaff}
        onOpenChange={() => setEditingStaff(null)}
      />
    </div>
  );
}

/**
 * Edit Staff Profile Dialog
 */
function EditStaffProfileDialog({
  staff,
  onOpenChange,
}: {
  staff: StaffEntity | null;
  onOpenChange: () => void;
}) {
  const [formData, setFormData] = useState<UpdateStaffProfileInput>({
    employmentType: null,
    joiningDate: null,
    department: null,
    designation: null,
    salary: null,
    emergencyContact: null,
  });

  const { mutate: updateProfile, isPending, error } = useUpdateStaffProfile();

  // Update form when staff changes
  useMemo(() => {
    if (staff) {
      setFormData({
        employmentType: staff.employmentType,
        joiningDate: staff.joiningDate?.split("T")[0] || null,
        department: staff.department,
        designation: staff.designation,
        salary: staff.salary,
        emergencyContact: staff.emergencyContact,
      });
    }
  }, [staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    updateProfile(
      {
        id: staff.id,
        data: {
          ...formData,
          joiningDate: formData.joiningDate ? new Date(formData.joiningDate).toISOString() : null,
        },
      },
      {
        onSuccess: () => onOpenChange(),
      }
    );
  };

  return (
    <Dialog open={!!staff} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff Profile</DialogTitle>
          <DialogDescription>
            Update profile information for {staff?.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-error">
              {error instanceof Error ? error.message : "Failed to update profile"}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType || ""}
                onValueChange={(v) =>
                  setFormData({ ...formData, employmentType: (v as EmploymentType) || null })
                }
              >
                <SelectTrigger id="employmentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, joiningDate: e.target.value || null })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department || ""}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value || null })
                }
                placeholder="e.g., Mathematics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value || null })
                }
                placeholder="e.g., Senior Teacher"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary (₹)</Label>
              <Input
                id="salary"
                type="number"
                min={0}
                value={formData.salary ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    salary: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                placeholder="e.g., 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                type="tel"
                value={formData.emergencyContact || ""}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContact: e.target.value || null })
                }
                placeholder="Phone number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
