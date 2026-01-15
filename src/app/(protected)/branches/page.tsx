"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Search,
  AlertCircle,
  Edit,
  MapPin,
  Users,
  GraduationCap,
  Star,
} from "lucide-react";
import { useBranches, useUpdateBranch } from "@/lib/api/branches";
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
  Checkbox,
} from "@/components/ui";
import type { Branch, UpdateBranchInput } from "@/types/branch";
import { PAGINATION_DEFAULTS } from "@/types";

/**
 * Branches Management Page
 *
 * Displays branches in a searchable, paginated table.
 * Supports creating and editing branches.
 */
export default function BranchesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { can } = usePermissions();
  const canManageBranches = can("SETTINGS_MANAGE");

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = useBranches({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    search: debouncedSearch || undefined,
  });

  const branches = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<Branch>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Branch Name",
        cell: ({ row }) => {
          const branch = row.original;
          return (
            <div className="flex items-center gap-2">
              <p className="font-medium">{branch.name}</p>
              {branch.isDefault && (
                <Badge variant="warning" className="text-xs">
                  <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                  Default
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ row }) => {
          const branch = row.original;
          const location = [branch.city, branch.state]
            .filter(Boolean)
            .join(", ");
          return location ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-text-muted" aria-hidden="true" />
              <span>{location}</span>
            </div>
          ) : (
            <span className="text-text-muted">—</span>
          );
        },
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>{row.original.userCount}</span>
          </div>
        ),
      },
      {
        accessorKey: "studentCount",
        header: "Students",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span>{row.original.studentCount}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManageBranches ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingBranch(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          ) : null,
      },
    ],
    [canManageBranches]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Branches</h1>
          <p className="text-sm text-text-muted">
            View branches in your organization
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search branches"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load branches. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Branches Table */}
      {!error && (
        <>
          {!isLoading && branches.length === 0 && !searchQuery ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="No branches yet"
                description="Branches are managed by the system administrator"
              />
            </Card>
          ) : !isLoading && branches.length === 0 ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="No branches found"
                description={`No branches match "${searchQuery}"`}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card>
              <DataTable
                columns={columns}
                data={branches}
                paginationMode="server"
                serverPagination={pagination}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                pageSize={PAGINATION_DEFAULTS.LIMIT}
                emptyMessage="No branches found."
              />
            </Card>
          )}
        </>
      )}

      {/* Edit Branch Dialog */}
      <EditBranchDialog
        branch={editingBranch}
        onOpenChange={() => setEditingBranch(null)}
      />
    </div>
  );
}

/**
 * Edit Branch Dialog
 */
function EditBranchDialog({
  branch,
  onOpenChange,
}: {
  branch: Branch | null;
  onOpenChange: () => void;
}) {
  const [formData, setFormData] = useState<UpdateBranchInput>({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const { mutate: updateBranch, isPending, error } = useUpdateBranch();

  // Update form when branch changes
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name,
        address: branch.address || "",
        city: branch.city || "",
        state: branch.state || "",
        pincode: branch.pincode || "",
        isDefault: branch.isDefault,
      });
    }
  }, [branch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;

    updateBranch(
      {
        id: branch.id,
        data: formData,
      },
      {
        onSuccess: () => onOpenChange(),
      }
    );
  };

  return (
    <Dialog open={!!branch} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>
            Update branch information for {branch?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-error">
              {error instanceof Error ? error.message : "Failed to update branch"}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="editName">Branch Name</Label>
            <Input
              id="editName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAddress">Address</Label>
            <Input
              id="editAddress"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editCity">City</Label>
              <Input
                id="editCity"
                value={formData.city || ""}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editState">State</Label>
              <Input
                id="editState"
                value={formData.state || ""}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPincode">Pincode</Label>
            <Input
              id="editPincode"
              value={formData.pincode || ""}
              onChange={(e) =>
                setFormData({ ...formData, pincode: e.target.value })
              }
              maxLength={10}
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="editIsDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked === true })
              }
            />
            <label
              htmlFor="editIsDefault"
              className="text-sm font-medium text-text-primary cursor-pointer"
            >
              Set as default branch
            </label>
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
