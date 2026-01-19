"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { apiClient } from "@/lib/api/client";
import type { UserEntity, UserRole } from "@/types/user";
import type { PaginatedResponse } from "@/types";

export interface UserAutocompleteProps {
  /** Selected user ID */
  value?: string;
  /** Called when selection changes */
  onChange: (value: string | undefined) => void;
  /** Filter by role (e.g., "teacher") */
  role?: UserRole;
  /** Placeholder text when nothing selected */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show clear button when value is selected */
  allowClear?: boolean;
}

/**
 * Fetch users with search and role filter
 */
async function searchUsers(
  search: string,
  role?: UserRole
): Promise<UserEntity[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  params.set("isActive", "true");
  params.set("limit", "20");

  const endpoint = `/users?${params.toString()}`;
  const response = await apiClient.get<PaginatedResponse<UserEntity>>(endpoint);
  return response.data;
}

/**
 * Fetch a single user by ID
 */
async function fetchUserById(id: string): Promise<UserEntity | null> {
  try {
    const response = await apiClient.get<{ data: UserEntity }>(`/users/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

/**
 * UserAutocomplete - Searchable dropdown to select a user
 *
 * Features:
 * - Debounced search (searches as you type)
 * - Filter by role (teacher, admin, etc.)
 * - Shows selected user name
 * - Loading states
 * - Clear button
 */
export function UserAutocomplete({
  value,
  onChange,
  role,
  placeholder = "Select user...",
  disabled = false,
  className,
  allowClear = true,
}: UserAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users based on search
  const {
    data: users = [],
    isLoading: isSearching,
    isFetching,
  } = useQuery({
    queryKey: ["users", "autocomplete", debouncedSearch, role],
    queryFn: () => searchUsers(debouncedSearch, role),
    enabled: open, // Only fetch when dropdown is open
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Fetch selected user details if we have a value but no match in current results
  const { data: selectedUser, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["users", "detail", value],
    queryFn: () => fetchUserById(value!),
    enabled: !!value && !users.find((u) => u.id === value),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get display name for selected value
  const getDisplayName = React.useCallback(() => {
    if (!value) return null;

    // First check current search results
    const userInResults = users.find((u) => u.id === value);
    if (userInResults) {
      return userInResults.fullName || `${userInResults.firstName} ${userInResults.lastName}`;
    }

    // Check fetched selected user
    if (selectedUser) {
      return selectedUser.fullName || `${selectedUser.firstName} ${selectedUser.lastName}`;
    }

    return null;
  }, [value, users, selectedUser]);

  const displayName = getDisplayName();
  const isLoading = isSearching || isFetching || isLoadingSelected;

  const handleSelect = (userId: string) => {
    onChange(userId === value ? undefined : userId);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !displayName && "text-text-muted",
            className
          )}
        >
          <span className="truncate">
            {displayName || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && allowClear && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${role || "users"}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
              </div>
            )}
            {!isLoading && users.length === 0 && (
              <CommandEmpty>
                {debouncedSearch
                  ? "No users found."
                  : "Start typing to search..."}
              </CommandEmpty>
            )}
            {!isLoading && users.length > 0 && (
              <CommandGroup>
                {users.map((user) => {
                  const name = user.fullName || `${user.firstName} ${user.lastName}`;
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleSelect(user.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{name}</span>
                        {user.role && (
                          <span className="text-xs text-text-muted capitalize">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
