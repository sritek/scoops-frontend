"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Users,
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  EmptyState,
} from "@/components/ui";
import { useBatch } from "@/lib/api/batches";
import { useCurrentSession } from "@/lib/api/sessions";
import {
  useBatchFeeStructureByBatch,
  useAllFeeComponents,
  useCreateBatchFeeStructure,
  useApplyBatchFeeStructure,
} from "@/lib/api";
import { usePermissions } from "@/lib/hooks";
import type { FeeComponent } from "@/types/fee";

interface LineItemInput {
  feeComponentId: string;
  amount: string;
}

/**
 * Batch Fee Structure Page
 *
 * Allows viewing, creating, and applying fee structures for batches.
 */
export default function BatchFeesPage() {
  const params = useParams();
  const batchId = params.id as string;
  const { can } = usePermissions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  // Fetch data
  const { data: batchData, isLoading: batchLoading } = useBatch(batchId);
  const { data: currentSession, isLoading: sessionLoading } = useCurrentSession();
  const { data: feeStructure, isLoading: structureLoading } = useBatchFeeStructureByBatch(
    batchId,
    currentSession?.id || null
  );
  const { data: feeComponents } = useAllFeeComponents();

  const batch = batchData?.data;
  const canManageFees = can("FEE_UPDATE");

  const isLoading = batchLoading || sessionLoading || structureLoading;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Batch not found</p>
        <Button asChild className="mt-4">
          <Link href="/batches">Back to Batches</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/batches/${batchId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Fee Structure
            </h1>
            <p className="text-sm text-text-muted">
              {batch.name} • {currentSession?.name || "Current Session"}
            </p>
          </div>
        </div>

        {canManageFees && (
          <div className="flex gap-2">
            {feeStructure ? (
              <>
                <Button variant="secondary" onClick={() => setShowCreateDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Structure
                </Button>
                <Button onClick={() => setShowApplyDialog(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Apply to Students
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Structure
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Fee Structure Display */}
      {feeStructure ? (
        <FeeStructureCard structure={feeStructure} />
      ) : (
        <Card>
          <EmptyState
            icon={Layers}
            title="No fee structure defined"
            description="Create a fee structure to define the fees for this batch"
            action={
              canManageFees ? (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Structure
                </Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {/* Create/Edit Dialog */}
      {currentSession && (
        <CreateEditDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          batchId={batchId}
          sessionId={currentSession.id}
          sessionName={currentSession.name}
          batchName={batch.name}
          existingStructure={feeStructure}
          feeComponents={feeComponents || []}
        />
      )}

      {/* Apply to Students Dialog */}
      {feeStructure && (
        <ApplyToStudentsDialog
          open={showApplyDialog}
          onOpenChange={setShowApplyDialog}
          structureId={feeStructure.id}
          structureName={feeStructure.name}
          batchName={batch.name}
        />
      )}
    </div>
  );
}

/**
 * Fee Structure Display Card
 */
function FeeStructureCard({
  structure,
}: {
  structure: {
    id: string;
    name: string;
    totalAmount: number;
    isActive: boolean;
    createdAt: string;
    lineItems: Array<{
      id: string;
      feeComponentId: string;
      feeComponent: { id: string; name: string; type: string };
      amount: number;
    }>;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5 text-text-muted" />
            {structure.name}
          </CardTitle>
          <Badge variant={structure.isActive ? "success" : "default"}>
            {structure.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Line Items */}
          <div className="rounded-lg border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">
                    Fee Component
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {structure.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">
                      {item.feeComponent.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="capitalize">
                        {item.feeComponent.type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-surface-elevated">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-lg">
                    {formatCurrency(structure.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-text-muted">
            Created: {formatDate(structure.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Create/Edit Fee Structure Dialog
 */
function CreateEditDialog({
  open,
  onOpenChange,
  batchId,
  sessionId,
  sessionName,
  batchName,
  existingStructure,
  feeComponents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  sessionId: string;
  sessionName: string;
  batchName: string;
  existingStructure?: {
    id: string;
    name: string;
    lineItems: Array<{
      feeComponentId: string;
      amount: number;
    }>;
  } | null;
  feeComponents: FeeComponent[];
}) {
  const [name, setName] = useState(
    existingStructure?.name || `${batchName} - ${sessionName} Fee Structure`
  );
  const [lineItems, setLineItems] = useState<LineItemInput[]>(
    existingStructure?.lineItems.map((li) => ({
      feeComponentId: li.feeComponentId,
      amount: String(li.amount),
    })) || []
  );

  const { mutate: createStructure, isPending } = useCreateBatchFeeStructure();

  // Calculate total
  const total = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [lineItems]);

  // Get available components (not already added)
  const availableComponents = useMemo(() => {
    const usedIds = new Set(lineItems.map((li) => li.feeComponentId));
    return feeComponents.filter((c) => !usedIds.has(c.id) && c.isActive);
  }, [feeComponents, lineItems]);

  const handleAddComponent = (componentId: string) => {
    setLineItems([...lineItems, { feeComponentId: componentId, amount: "" }]);
  };

  const handleRemoveComponent = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAmountChange = (index: number, amount: string) => {
    const newItems = [...lineItems];
    newItems[index].amount = amount;
    setLineItems(newItems);
  };

  const handleSubmit = () => {
    if (!name || lineItems.length === 0) {
      toast.error("Please add at least one fee component");
      return;
    }

    const invalidItems = lineItems.filter(
      (li) => !li.amount || parseFloat(li.amount) <= 0
    );
    if (invalidItems.length > 0) {
      toast.error("Please enter valid amounts for all components");
      return;
    }

    createStructure(
      {
        batchId,
        sessionId,
        name,
        lineItems: lineItems.map((li) => ({
          feeComponentId: li.feeComponentId,
          amount: parseFloat(li.amount),
        })),
      },
      {
        onSuccess: () => {
          toast.success(
            existingStructure
              ? "Fee structure updated successfully"
              : "Fee structure created successfully"
          );
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to save fee structure");
        },
      }
    );
  };

  const getComponentName = (componentId: string) => {
    return feeComponents.find((c) => c.id === componentId)?.name || "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
          </DialogTitle>
          <DialogDescription>
            Define the fee components and amounts for {batchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Structure Name */}
          <div className="space-y-2">
            <Label htmlFor="structureName">Structure Name</Label>
            <Input
              id="structureName"
              placeholder="e.g., 2025-26 Fee Structure"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <Label>Fee Components</Label>
            {lineItems.length === 0 ? (
              <p className="text-sm text-text-muted py-2">
                No components added yet. Add components to build the fee structure.
              </p>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div
                    key={item.feeComponentId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-surface-elevated"
                  >
                    <span className="flex-1 text-sm font-medium">
                      {getComponentName(item.feeComponentId)}
                    </span>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleAmountChange(index, e.target.value)}
                      className="w-32"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveComponent(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Component */}
            {availableComponents.length > 0 && (
              <Select onValueChange={handleAddComponent}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Add fee component..." />
                </SelectTrigger>
                <SelectContent>
                  {availableComponents.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Total */}
          {lineItems.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || lineItems.length === 0 || isPending}
          >
            {isPending
              ? "Saving..."
              : existingStructure
              ? "Update Structure"
              : "Create Structure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Apply to Students Dialog
 */
function ApplyToStudentsDialog({
  open,
  onOpenChange,
  structureId,
  structureName,
  batchName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  structureId: string;
  structureName: string;
  batchName: string;
}) {
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const { mutate: applyStructure, isPending } = useApplyBatchFeeStructure();

  const handleApply = () => {
    applyStructure(
      { id: structureId, overwriteExisting },
      {
        onSuccess: (result) => {
          toast.success(
            `Applied to ${result.applied} students${
              result.skipped > 0 ? `, ${result.skipped} skipped` : ""
            }`
          );
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to apply fee structure");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Fee Structure to Students</DialogTitle>
          <DialogDescription>
            Apply &quot;{structureName}&quot; to all students in {batchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Important</p>
              <p className="mt-1">
                This will create fee structures for all active students in the
                batch. Students with custom fee structures will be skipped by
                default.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="overwrite"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="overwrite" className="text-sm font-normal">
              Overwrite existing student fee structures
            </Label>
          </div>

          {overwriteExisting && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Warning</p>
                <p className="mt-1">
                  This will replace any custom fee structures students may have,
                  including scholarship adjustments. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isPending}>
            {isPending ? (
              "Applying..."
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Apply to Students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Loading skeleton
 */
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
