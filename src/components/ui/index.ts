/**
 * UI Component Library
 *
 * Styled wrappers around Radix UI primitives
 * following Sritek Design System v1.0
 *
 * Usage:
 * import { Button, Input, Card } from "@/components/ui";
 */

// Button
export { Button, buttonVariants, buttonSizes } from "./button";
export type { ButtonProps } from "./button";

// Form components
export { Label } from "./label";
export type { LabelProps } from "./label";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

export { Checkbox } from "./checkbox";
export type { CheckboxProps } from "./checkbox";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";

// Dialog (Modal)
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";

// Card
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

// Badge
export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

// Spinner
export { Spinner, PageLoader, spinnerSizes } from "./spinner";
export type { SpinnerProps } from "./spinner";

// Loading Overlay
export { LoadingOverlay } from "./loading-overlay";
export type { LoadingOverlayProps } from "./loading-overlay";

// Stat Card
export { StatCard, StatCardSkeleton } from "./stat-card";
export type { StatCardProps } from "./stat-card";

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";

// DataTable (TanStack Table wrapper)
export { DataTable } from "./data-table";
export type { DataTableProps, PaginationMode } from "./data-table";

// Table Skeleton
export { TableSkeleton, Skeleton } from "./table-skeleton";
export type { TableSkeletonProps, SkeletonProps } from "./table-skeleton";

// Empty State
export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";

// Access Denied
export { AccessDenied, AccessDeniedPage } from "./access-denied";
export type { AccessDeniedProps } from "./access-denied";

// Pagination
export { Pagination, PaginationInfo } from "./pagination";
export type { PaginationProps } from "./pagination";

// Photo Upload
export { PhotoUpload, Avatar } from "./photo-upload";
export type { PhotoUploadProps, AvatarProps } from "./photo-upload";

// Theme Toggle
export { ThemeToggle, useAppTheme } from "./theme-toggle";

// Command (cmdk wrapper)
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandLoading,
} from "./command";

// Popover
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "./popover";

// User Autocomplete (for large datasets with server-side search)
export { UserAutocomplete } from "./user-autocomplete";
export type { UserAutocompleteProps } from "./user-autocomplete";

// Searchable Select (for small datasets with client-side filtering)
export { SearchableSelect } from "./searchable-select";
export type {
  SearchableSelectProps,
  SearchableSelectOption,
} from "./searchable-select";

// Student Search Select (for selecting students with batch filtering)
export { StudentSearchSelect } from "./student-search-select";
export type { StudentSearchSelectProps } from "./student-search-select";

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
