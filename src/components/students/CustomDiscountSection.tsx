"use client";

import { useState, useMemo, useCallback } from "react";
import { Percent, IndianRupee, AlertCircle, Tag } from "lucide-react";
import {
  Card,
  CardContent,
  Checkbox,
  Input,
  Label,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import type { CustomDiscountInput, CustomDiscountType } from "@/types/fee";

/**
 * Custom discount state interface
 */
export interface CustomDiscountState {
  enabled: boolean;
  type: CustomDiscountType;
  value: number | null;
  remarks: string;
}

/**
 * Props for CustomDiscountSection component
 */
interface CustomDiscountSectionProps {
  /** Gross amount from fee structure (in paise/INR) */
  grossAmount: number | null;
  /** Whether a fee structure is selected */
  hasFeeStructure: boolean;
  /** Callback when custom discount changes */
  onChange: (discount: CustomDiscountInput | undefined) => void;
  /** Initial discount state (for editing) */
  initialValue?: CustomDiscountInput;
}

/**
 * Calculate custom discount amount based on type and gross amount
 */
function calculateDiscountAmount(
  type: CustomDiscountType,
  value: number,
  grossAmount: number,
): number {
  if (grossAmount <= 0 || value <= 0) {
    return 0;
  }

  if (type === "percentage") {
    const cappedPercentage = Math.min(value, 100);
    return Math.round((grossAmount * cappedPercentage) / 100);
  }

  // Fixed amount - cap at gross amount
  return Math.min(value, grossAmount);
}

/**
 * CustomDiscountSection Component
 *
 * Provides UI for adding a custom discount during student creation.
 * Supports percentage and fixed amount discount types with live preview.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8
 */
export function CustomDiscountSection({
  grossAmount,
  hasFeeStructure,
  onChange,
  initialValue,
}: CustomDiscountSectionProps) {
  // State management for custom discount
  const [enabled, setEnabled] = useState(!!initialValue);
  const [type, setType] = useState<CustomDiscountType>(
    initialValue?.type ?? "percentage",
  );
  const [value, setValue] = useState<string>(
    initialValue?.value?.toString() ?? "",
  );
  const [remarks, setRemarks] = useState(initialValue?.remarks ?? "");

  // Parse value as number
  const numericValue = useMemo(() => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }, [value]);

  // Calculate discount amount for preview
  const calculatedAmount = useMemo(() => {
    if (!enabled || numericValue === null || !grossAmount) {
      return null;
    }
    return calculateDiscountAmount(type, numericValue, grossAmount);
  }, [enabled, type, numericValue, grossAmount]);

  // Validation state
  const validationError = useMemo(() => {
    if (!enabled || numericValue === null) {
      return null;
    }

    if (type === "percentage") {
      if (numericValue < 0 || numericValue > 100) {
        return "Percentage must be between 0 and 100";
      }
    } else {
      if (numericValue <= 0) {
        return "Amount must be a positive number";
      }
    }

    return null;
  }, [enabled, type, numericValue]);

  // Notify parent of changes
  const notifyChange = useCallback(
    (
      isEnabled: boolean,
      discountType: CustomDiscountType,
      discountValue: number | null,
      discountRemarks: string,
    ) => {
      if (!isEnabled || discountValue === null || discountValue <= 0) {
        onChange(undefined);
        return;
      }

      // Validate before sending
      if (
        discountType === "percentage" &&
        (discountValue < 0 || discountValue > 100)
      ) {
        onChange(undefined);
        return;
      }

      onChange({
        type: discountType,
        value: discountValue,
        remarks: discountRemarks || undefined,
      });
    },
    [onChange],
  );

  // Handle enable/disable toggle
  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      // Reset values when disabled
      setValue("");
      setRemarks("");
      onChange(undefined);
    } else {
      notifyChange(true, type, numericValue, remarks);
    }
  };

  // Handle type change
  const handleTypeChange = (newType: CustomDiscountType) => {
    setType(newType);
    setValue(""); // Reset value when type changes
    notifyChange(enabled, newType, null, remarks);
  };

  // Handle value change
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    const parsed = parseFloat(newValue);
    const numVal = isNaN(parsed) ? null : parsed;
    notifyChange(enabled, type, numVal, remarks);
  };

  // Handle remarks change
  const handleRemarksChange = (newRemarks: string) => {
    setRemarks(newRemarks);
    notifyChange(enabled, type, numericValue, newRemarks);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-text-muted" />
        Custom Discount (Optional)
      </Label>

      <Card className="border-border-subtle">
        <CardContent className="pt-4 space-y-4">
          {/* Enable checkbox */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="enableCustomDiscount"
              checked={enabled}
              onCheckedChange={(checked) =>
                handleEnabledChange(checked === true)
              }
            />
            <label
              htmlFor="enableCustomDiscount"
              className="text-sm font-medium text-text-primary cursor-pointer flex-1"
            >
              Apply custom discount
            </label>
            {enabled && calculatedAmount !== null && !validationError && (
              <Badge variant="success">
                -₹{calculatedAmount.toLocaleString("en-IN")}
              </Badge>
            )}
          </div>

          {/* Warning when no fee structure */}
          {enabled && !hasFeeStructure && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                Select a batch with a fee structure first. The custom discount
                will be applied when a fee structure is created.
              </p>
            </div>
          )}

          {/* Discount inputs (shown when enabled) */}
          {enabled && (
            <div className="space-y-4 pt-2">
              {/* Type selector */}
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={type} onValueChange={handleTypeChange}>
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <span>Percentage</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed_amount">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        <span>Fixed Amount</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value input */}
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {type === "percentage" ? "Percentage (0-100)" : "Amount (₹)"}
                </Label>
                <div className="relative">
                  <Input
                    id="discountValue"
                    type="number"
                    min={0}
                    max={type === "percentage" ? 100 : undefined}
                    step={1}
                    placeholder={
                      type === "percentage" ? "e.g., 10" : "e.g., 5000"
                    }
                    value={value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className={validationError ? "border-error" : ""}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                    {type === "percentage" ? "%" : "₹"}
                  </span>
                </div>
                {validationError && (
                  <p className="text-sm text-error">{validationError}</p>
                )}
              </div>

              {/* Live preview */}
              {hasFeeStructure &&
                grossAmount &&
                calculatedAmount !== null &&
                !validationError && (
                  <div className="p-3 rounded-md bg-bg-subtle border border-border-subtle">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-muted">
                        Calculated discount:
                      </span>
                      <span className="font-medium text-success">
                        ₹{calculatedAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    {type === "percentage" && numericValue && (
                      <p className="text-xs text-text-muted mt-1">
                        {numericValue}% of ₹
                        {grossAmount.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                )}

              {/* Remarks textarea */}
              <div className="space-y-2">
                <Label htmlFor="discountRemarks">
                  Reason / Remarks (Optional)
                </Label>
                <textarea
                  id="discountRemarks"
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-border-default bg-bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="e.g., Sibling discount, Early bird offer, Special arrangement..."
                  value={remarks}
                  onChange={(e) => handleRemarksChange(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-text-muted">
                  {remarks.length}/500 characters
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
