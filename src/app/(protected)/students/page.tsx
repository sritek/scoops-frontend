"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, Search, Phone, AlertCircle, Filter } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useStudents } from "@/lib/api/students";
import { useBatches } from "@/lib/api/batches";
import { usePermissions, useDebounce } from "@/lib/hooks";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  DataTable,
  EmptyState,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import type { Student, StudentParent } from "@/types/student";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Students List Page
 *
 * Displays students in a searchable, paginated table using DataTable component.
 * Supports server-side search and batch filtering.
 * Permission-gated "Add Student" button.
 *
 * Requires: STUDENT_VIEW permission
 */
export default function StudentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { can } = usePermissions();

  // Debounce search for server-side filtering
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch batches for filter dropdown
  const { data: batchesData } = useBatches({ limit: 100 });
  const batches = batchesData?.data ?? [];

  // Fetch students with pagination and filters
  const { data, isLoading, error } = useStudents({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    search: debouncedSearch || undefined,
    batchId: selectedBatchId || undefined,
    status: (selectedStatus as "active" | "inactive") || undefined,
    gender: (selectedGender as "male" | "female" | "other") || undefined,
    category:
      (selectedCategory as "gen" | "sc" | "st" | "obc" | "minority") ||
      undefined,
  });

  const students = data?.data ?? [];
  const pagination = data?.pagination;

  const canAddStudent = can("STUDENT_EDIT");

  // Reset to page 1 when search or filter changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleBatchChange = useCallback((value: string) => {
    setSelectedBatchId(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const handleGenderChange = useCallback((value: string) => {
    setSelectedGender(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedBatchId("");
    setSelectedStatus("");
    setSelectedGender("");
    setSelectedCategory("");
    setCurrentPage(1);
  }, []);

  const hasFilters =
    searchQuery ||
    selectedBatchId ||
    selectedStatus ||
    selectedGender ||
    selectedCategory;

  // Column definitions for the DataTable
  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => {
          const student = row.original;
          return (
            <Link
              href={`/students/${student.id}`}
              className="block hover:text-primary-600"
            >
              <p className="font-medium">{student.fullName}</p>
              {student.category && (
                <p className="text-xs text-text-muted capitalize">
                  {student.category}
                  {student.isCwsn && " • CWSN"}
                </p>
              )}
            </Link>
          );
        },
      },
      {
        accessorKey: "gender",
        header: "Gender",
        cell: ({ row }) => {
          const gender = row.original.gender;
          if (!gender) return <span className="text-text-muted">—</span>;
          return <span className="capitalize">{gender}</span>;
        },
        meta: {
          headerClassName: "hidden sm:table-cell",
          cellClassName: "hidden sm:table-cell",
        },
      },
      {
        accessorKey: "batchName",
        header: "Batch",
        cell: ({ row }) => {
          const batchName = row.original.batchName;
          if (!batchName) return <span className="text-text-muted">—</span>;
          return (
            <Badge variant="info" className="font-normal">
              {batchName}
            </Badge>
          );
        },
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "parents",
        header: "Parent Contact",
        cell: ({ row }) => {
          const parents = row.original.parents ?? [];
          const primaryParent = getPrimaryParent(parents);

          if (!primaryParent) {
            return <span className="text-text-muted">—</span>;
          }

          return (
            <div className="flex items-center gap-2">
              <Phone
                className="h-3.5 w-3.5 text-text-muted"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm">{primaryParent.phone}</p>
                <p className="text-xs text-text-muted capitalize">
                  {primaryParent.relation}
                </p>
              </div>
            </div>
          );
        },
        meta: {
          headerClassName: "hidden lg:table-cell",
          cellClassName: "hidden lg:table-cell",
        },
      },
      {
        accessorKey: "admissionYear",
        header: "Admission Year",
        cell: ({ row }) => row.original.admissionYear,
        meta: {
          headerClassName: "hidden xl:table-cell",
          cellClassName: "hidden xl:table-cell",
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={status === "active" ? "success" : "default"}>
              {status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Students</h1>
          <p className="text-sm text-text-muted">
            Manage students in your branch
          </p>
        </div>

        {canAddStudent && (
          <Button asChild>
            <Link href="/students/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Student
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* First Row: Search and Clear Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              aria-label="Search students"
            />
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Second Row: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />

          {/* Batch Filter */}
          <Select
            value={selectedBatchId || "all"}
            onValueChange={handleBatchChange}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender Filter */}
          <Select
            value={selectedGender || "all"}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            value={selectedCategory || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="gen">General</SelectItem>
              <SelectItem value="sc">SC</SelectItem>
              <SelectItem value="st">ST</SelectItem>
              <SelectItem value="obc">OBC</SelectItem>
              <SelectItem value="minority">Minority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load students. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      {!error && (
        <>
          {!isLoading && students.length === 0 && !hasFilters ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No students yet"
                description="Add your first student to get started"
                action={
                  canAddStudent ? (
                    <Button asChild>
                      <Link href="/students/new">
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Add Student
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : !isLoading && students.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No students found"
                description={
                  searchQuery
                    ? `No students match "${searchQuery}"`
                    : "No students match the selected filters"
                }
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card>
              <DataTable
                columns={columns}
                data={students}
                paginationMode="server"
                serverPagination={pagination}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                pageSize={PAGINATION_DEFAULTS.LIMIT}
                emptyMessage="No students found."
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Get primary parent (father or first available)
 */
function getPrimaryParent(parents: StudentParent[]): StudentParent | undefined {
  return parents.find((p) => p.relation === "father") || parents[0];
}
