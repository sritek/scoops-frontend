"use client";

import { useState, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Plus,
  Search,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
} from "lucide-react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetUserPassword } from "@/lib/api/users";
import { usePermissions } from "@/lib/hooks";
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
  DropdownMenuSeparator,
} from "@/components/ui";
import type { UserEntity, UserRole, CreateUserInput } from "@/types/user";
import { PAGINATION_DEFAULTS } from "@/types";

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "accounts", label: "Accounts" },
  { value: "staff", label: "Staff" },
];

/**
 * Users Management Page
 *
 * Displays users in a searchable, paginated table.
 * Supports creating, editing, and deactivating users.
 */
export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserEntity | null>(null);
  const [userToReset, setUserToReset] = useState<UserEntity | null>(null);
  const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(null);

  const { can } = usePermissions();
  const canManageUsers = can("USER_MANAGE");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, error } = useUsers({
    page: currentPage,
    limit: PAGINATION_DEFAULTS.LIMIT,
    search: debouncedSearch || undefined,
    role: (roleFilter as UserRole) || undefined,
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<UserEntity>[] = useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-xs text-text-muted">{user.employeeId}</p>
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
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "—",
        meta: {
          headerClassName: "hidden md:table-cell",
          cellClassName: "hidden md:table-cell",
        },
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
                <DropdownMenuItem onClick={() => setEditingUser(row.original)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setUserToReset(row.original)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setUserToDelete(row.original)}
                  className="text-error focus:text-error"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deactivate
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
          <h1 className="text-xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-muted">
            Manage users in your branch
          </p>
        </div>

        {canManageUsers && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add User
          </Button>
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
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            aria-label="Search users"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <Select value={roleFilter || "all"} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-[150px]">
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
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load users. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {!error && (
        <>
          {!isLoading && users.length === 0 && !searchQuery && !roleFilter ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No users yet"
                description="Add your first user to get started"
                action={
                  canManageUsers ? (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Add User
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : !isLoading && users.length === 0 ? (
            <Card>
              <EmptyState
                icon={Users}
                title="No users found"
                description={
                  searchQuery
                    ? `No users match "${searchQuery}"`
                    : "No users with the selected role"
                }
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setRoleFilter("");
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
                data={users}
                paginationMode="server"
                serverPagination={pagination}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                pageSize={PAGINATION_DEFAULTS.LIMIT}
                emptyMessage="No users found."
              />
            </Card>
          )}
        </>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={(password) => setCreatedUserPassword(password)}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editingUser}
        onOpenChange={() => setEditingUser(null)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        user={userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        user={userToReset}
        onOpenChange={() => setUserToReset(null)}
      />

      {/* Created User Password Dialog */}
      <Dialog
        open={!!createdUserPassword}
        onOpenChange={() => setCreatedUserPassword(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              Please share the temporary password with the user. They will be
              required to change it on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-bg-app p-4 text-center">
              <p className="text-sm text-text-muted mb-1">Temporary Password</p>
              <p className="text-lg font-mono font-bold">{createdUserPassword}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedUserPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Create User Dialog
 */
function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (password: string) => void;
}) {
  const [formData, setFormData] = useState<CreateUserInput>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "staff",
  });

  const { mutate: createUser, isPending, error } = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData, {
      onSuccess: (data) => {
        onOpenChange(false);
        onSuccess(data.tempPassword);
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          role: "staff",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. A temporary password will be generated.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-error">
              {error instanceof Error ? error.message : "Failed to create user"}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(v) =>
                setFormData({ ...formData, role: v as UserRole })
              }
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit User Dialog
 */
function EditUserDialog({
  user,
  onOpenChange,
}: {
  user: UserEntity | null;
  onOpenChange: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "staff" as UserRole,
  });

  const { mutate: updateUser, isPending, error } = useUpdateUser();

  // Update form when user changes
  useMemo(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email || "",
        role: user.role,
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    updateUser(
      {
        id: user.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || null,
          role: formData.role,
        },
      },
      {
        onSuccess: () => onOpenChange(),
      }
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information for {user?.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-error">
              {error instanceof Error ? error.message : "Failed to update user"}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPhone">Phone</Label>
            <Input
              id="editPhone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editEmail">Email (Optional)</Label>
            <Input
              id="editEmail"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editRole">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(v) =>
                setFormData({ ...formData, role: v as UserRole })
              }
            >
              <SelectTrigger id="editRole">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

/**
 * Delete User Confirmation Dialog
 */
function DeleteUserDialog({
  user,
  onOpenChange,
}: {
  user: UserEntity | null;
  onOpenChange: () => void;
}) {
  const { mutate: deleteUser, isPending } = useDeleteUser();

  const handleDelete = () => {
    if (!user) return;
    deleteUser(user.id, {
      onSuccess: () => onOpenChange(),
    });
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate {user?.fullName}? They will no
            longer be able to log in.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onOpenChange}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Reset Password Dialog
 */
function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: UserEntity | null;
  onOpenChange: () => void;
}) {
  const { mutate: resetPassword, isPending, data } = useResetUserPassword();

  const handleReset = () => {
    if (!user) return;
    resetPassword(user.id);
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {data
              ? "Password has been reset successfully."
              : `Reset password for ${user?.fullName}? A new temporary password will be generated.`}
          </DialogDescription>
        </DialogHeader>

        {data && (
          <div className="py-4">
            <div className="rounded-lg bg-bg-app p-4 text-center">
              <p className="text-sm text-text-muted mb-1">New Temporary Password</p>
              <p className="text-lg font-mono font-bold">
                {data.message.split(": ")[1]}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {data ? (
            <Button onClick={onOpenChange}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onOpenChange}>
                Cancel
              </Button>
              <Button onClick={handleReset} disabled={isPending}>
                {isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
