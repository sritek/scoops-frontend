"use client";

import { useState } from "react";
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
  Skeleton,
  Badge,
} from "@/components/ui";
import { useEMITemplates, useGenerateInstallments } from "@/lib/api";
import { Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface GenerateInstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFeeStructureId: string;
  netAmount: number;
  onSuccess?: () => void;
}

/**
 * Dialog for generating installments for a student's fee structure
 */
export function GenerateInstallmentsDialog({
  open,
  onOpenChange,
  studentFeeStructureId,
  netAmount,
  onSuccess,
}: GenerateInstallmentsDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: emiTemplates, isLoading } = useEMITemplates();
  const generateInstallments = useGenerateInstallments();

  const selectedTemplate = emiTemplates?.find(
    (t) => t.id === selectedTemplateId
  );

  // Helper to safely get splitConfig as array (it may come as JSON string from API)
  const getSplitConfig = (
    config: unknown
  ): Array<{ percent: number; dueDaysFromStart: number }> => {
    if (!config) return [];
    if (typeof config === "string") {
      try {
        return JSON.parse(config);
      } catch {
        return [];
      }
    }
    if (Array.isArray(config)) return config;
    return [];
  };

  // Calculate installment amounts preview
  const installmentPreview = selectedTemplate
    ? getSplitConfig(selectedTemplate.splitConfig).map((inst, index) => ({
        number: index + 1,
        percentage: inst.percent,
        amount: Math.round((netAmount * inst.percent) / 100),
        daysFromStart: inst.dueDaysFromStart,
      }))
    : [];

  const handleSubmit = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select an EMI template");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    try {
      await generateInstallments.mutateAsync({
        studentFeeStructureId,
        emiTemplateId: selectedTemplateId,
        startDate,
      });

      toast.success("Installments generated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to generate installments");
    }
  };

  const handleClose = () => {
    setSelectedTemplateId(null);
    setStartDate(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  const formatDueDate = (daysFromStart: number): string => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysFromStart);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate Installments
          </DialogTitle>
          <DialogDescription>
            Select an EMI template to generate payment installments for the fee
            amount of ₹{netAmount.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">Payment Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Template Selection */}
            <div>
              <Label>Select EMI Template</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {emiTemplates && emiTemplates.length > 0 ? (
                  emiTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplateId === template.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-border-subtle hover:border-border-default"
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{template.name}</p>
                          {selectedTemplateId === template.id && (
                            <CheckCircle className="h-4 w-4 text-primary-500" />
                          )}
                        </div>
                        <Badge variant="default">
                          {template.installmentCount} installments
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-text-muted">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No EMI templates available</p>
                    <p className="text-sm mt-1">
                      Please contact admin to create EMI templates.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Installment Preview */}
            {selectedTemplate && installmentPreview.length > 0 && (
              <div>
                <Label>Installment Preview</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {installmentPreview.map((inst) => (
                    <div
                      key={inst.number}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <p className="font-medium">Installment {inst.number}</p>
                        <p className="text-sm text-text-muted">
                          Due: {formatDueDate(inst.daysFromStart)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{inst.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-text-muted">
                          {inst.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="destructive" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={generateInstallments.isPending || !selectedTemplateId}
          >
            {generateInstallments.isPending
              ? "Generating..."
              : "Generate Installments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
