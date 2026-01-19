"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
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

export interface SearchableSelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional secondary text */
  sublabel?: string;
}

export interface SearchableSelectProps {
  /** Array of options to display */
  options: SearchableSelectOption[];
  /** Currently selected value */
  value?: string;
  /** Called when selection changes */
  onChange: (value: string | undefined) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Message when no options match the search */
  emptyMessage?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Show loading spinner */
  isLoading?: boolean;
  /** Allow clearing the selection */
  allowClear?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchableSelect - A dropdown with built-in search filtering
 *
 * Features:
 * - Client-side filtering (uses cmdk's built-in filter)
 * - Clean UI matching design system
 * - Loading state support
 * - Optional sublabels for options
 * - Clear button
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  isLoading = false,
  allowClear = true,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Find the selected option to display its label
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const handleSelect = (selectedValue: string) => {
    // Toggle off if same value selected
    onChange(selectedValue === value ? undefined : selectedValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between font-normal h-10",
            !selectedOption && "text-text-muted",
            className
          )}
        >
          <span className="truncate">
            {isLoading ? "Loading..." : selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && allowClear && !isLoading && (
              <X
                className="h-4 w-4 text-text-muted hover:text-text-primary transition-colors"
                onClick={handleClear}
              />
            )}
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-text-muted" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-text-muted truncate">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
