"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Input,
  Checkbox,
  Skeleton,
} from "@/components/ui";
import {
  useBatchFeeStructureByBatch,
  useAllFeeComponents,
  useCreateStudentFeeStructure,
} from "@/lib/api";
import { useCurrentSession } from "@/lib/api/sessions";
import type { FeeComponent } from "@/types/fee";
import { toast } from "sonner";

interface CreateFeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  batchId: string | null;
  onSuccess?: () => void;
}

interface FeeLineItemInput {
  feeComponentId: string;
  feeComponent: FeeComponent;
  originalAmount: number;
  adjustedAmount: number;
  waived: boolean;
  waiverReason: string;
}

/**
 * Dialog for creating a fee structure for a student
 * Can either copy from batch fee structure or create custom
 */
export function CreateFeeStructureDialog({
  open,
  onOpenChange,
  studentId,
  batchId,
  onSuccess,
}: CreateFeeStructureDialogProps) {
  const [mode, setMode] = useState<"batch" | "custom">("batch");
  const [lineItems, setLineItems] = useState<FeeLineItemInput[]>([]);
  const [remarks, setRemarks] = useState("");

  const { data: currentSession } = useCurrentSession();
  const { data: batchStructure, isLoading: batchLoading } = useBatchFeeStructureByBatch(
    batchId,
    currentSession?.id || null
  );
  const { data: feeComponents, isLoading: componentsLoading } = useAllFeeComponents();
  const createFeeStructure = useCreateStudentFeeStructure();

  // Initialize line items from batch structure when available
  useMemo(() => {
    if (mode === "batch" && batchStructure?.lineItems) {
      setLineItems(
        batchStructure.lineItems.map((item) => ({
          feeComponentId: item.feeComponentId,
          feeComponent: item.feeComponent as FeeComponent,
          originalAmount: item.amount,
          adjustedAmount: item.amount,
          waived: false,
          waiverReason: "",
        }))
      );
    } else if (mode === "custom" && feeComponents) {
      // Start with empty custom structure
      setLineItems([]);
    }
  }, [mode, batchStructure, feeComponents]);

  const totalAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      if (item.waived) return sum;
      return sum + item.adjustedAmount;
    }, 0);
  }, [lineItems]);

  const addCustomComponent = (componentId: string) => {
    const component = feeComponents?.find((c) => c.id === componentId);
    if (!component) return;

    // Check if already added
    if (lineItems.some((item) => item.feeComponentId === componentId)) {
      toast.error("This component is already added");
      return;
    }

    setLineItems([
      ...lineItems,
      {
        feeComponentId: componentId,
        feeComponent: component,
        originalAmount: 0,
        adjustedAmount: 0,
        waived: false,
        waiverReason: "",
      },
    ]);
  };

  const updateLineItem = (index: number, updates: Partial<FeeLineItemInput>) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!currentSession?.id) {
      toast.error("No active session found");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Please add at least one fee component");
      return;
    }

    try {
      await createFeeStructure.mutateAsync({
        studentId,
        sessionId: currentSession.id,
        lineItems: lineItems.map((item) => ({
          feeComponentId: item.feeComponentId,
          originalAmount: item.originalAmount,
          adjustedAmount: item.waived ? 0 : item.adjustedAmount,
          waived: item.waived,
          waiverReason: item.waived ? item.waiverReason : undefined,
        })),
        remarks: remarks || undefined,
      });

      toast.success("Fee structure created successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create fee structure");
    }
  };

  const isLoading = batchLoading || componentsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
          <DialogDescription>
            Set up the fee structure for this student. You can copy from batch
            defaults or create a custom structure.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <Button
                variant={mode === "batch" ? "default" : "outline"}
                onClick={() => setMode("batch")}
                disabled={!batchStructure}
                className="flex-1"
              >
                Copy from Batch
                {!batchStructure && " (Not Available)"}
              </Button>
              <Button
                variant={mode === "custom" ? "default" : "outline"}
                onClick={() => setMode("custom")}
                className="flex-1"
              >
                Custom Structure
              </Button>
            </div>

            {mode === "batch" && !batchStructure && (
              <p className="text-sm text-text-muted text-center py-4">
                No batch fee structure exists for the current session. Please
                create a custom structure or contact admin to set up batch fees.
              </p>
            )}

            {/* Fee Line Items */}
            {lineItems.length > 0 && (
              <div className="space-y-3">
                <Label>Fee Components</Label>
                <div className="border rounded-lg divide-y">
                  {lineItems.map((item, index) => (
                    <div
                      key={item.feeComponentId}
                      className="p-3 flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.feeComponent.name}</p>
                        <p className="text-sm text-text-muted capitalize">
                          {item.feeComponent.type}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`waive-${index}`}
                          checked={item.waived}
                          onCheckedChange={(checked) =>
                            updateLineItem(index, { waived: checked === true })
                          }
                        />
                        <Label htmlFor={`waive-${index}`} className="text-sm">
                          Waive
                        </Label>
                      </div>

                      {item.waived ? (
                        <Input
                          placeholder="Waiver reason"
                          value={item.waiverReason}
                          onChange={(e) =>
                            updateLineItem(index, { waiverReason: e.target.value })
                          }
                          className="w-40"
                        />
                      ) : (
                        <Input
                          type="number"
                          value={item.adjustedAmount}
                          onChange={(e) =>
                            updateLineItem(index, {
                              adjustedAmount: Number(e.target.value),
                            })
                          }
                          className="w-28 text-right"
                        />
                      )}

                      {mode === "custom" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Component */}
            {mode === "custom" && feeComponents && (
              <div>
                <Label>Add Fee Component</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {feeComponents
                    .filter(
                      (c) => !lineItems.some((item) => item.feeComponentId === c.id)
                    )
                    .map((component) => (
                      <Button
                        key={component.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomComponent(component.id)}
                      >
                        + {component.name}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-surface-elevated rounded-lg">
              <span className="font-medium">Total Fee Amount</span>
              <span className="text-xl font-bold">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            {/* Remarks */}
            <div>
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional notes..."
                className="mt-2"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createFeeStructure.isPending || lineItems.length === 0}
          >
            {createFeeStructure.isPending ? "Creating..." : "Create Fee Structure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
