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
import {
  useAllScholarships,
  useAssignScholarship,
} from "@/lib/api";
import { useCurrentSession } from "@/lib/api/sessions";
import { formatScholarshipValue, getScholarshipBasisLabel } from "@/types/scholarship";
import type { Scholarship } from "@/types/scholarship";
import { Award, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AssignScholarshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  existingScholarshipIds?: string[];
  onSuccess?: () => void;
}

/**
 * Dialog for assigning a scholarship to a student
 */
export function AssignScholarshipDialog({
  open,
  onOpenChange,
  studentId,
  existingScholarshipIds = [],
  onSuccess,
}: AssignScholarshipDialogProps) {
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: currentSession } = useCurrentSession();
  const { data: scholarships, isLoading } = useAllScholarships();
  const assignScholarship = useAssignScholarship();

  // Filter scholarships based on search and exclude already assigned
  const availableScholarships = scholarships?.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.basis.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyAssigned = !existingScholarshipIds.includes(s.id);
    return matchesSearch && notAlreadyAssigned && s.isActive;
  });

  const handleSubmit = async () => {
    if (!selectedScholarship) {
      toast.error("Please select a scholarship");
      return;
    }

    if (!currentSession?.id) {
      toast.error("No active session found");
      return;
    }

    try {
      await assignScholarship.mutateAsync({
        studentId,
        scholarshipId: selectedScholarship.id,
        sessionId: currentSession.id,
        remarks: remarks || undefined,
      });

      toast.success("Scholarship assigned successfully");
      setSelectedScholarship(null);
      setSearchQuery("");
      setRemarks("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to assign scholarship");
    }
  };

  const handleClose = () => {
    setSelectedScholarship(null);
    setSearchQuery("");
    setRemarks("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Assign Scholarship
          </DialogTitle>
          <DialogDescription>
            Select a scholarship to apply to this student for the current session.
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
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Scholarship List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableScholarships && availableScholarships.length > 0 ? (
                availableScholarships.map((scholarship) => (
                  <div
                    key={scholarship.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedScholarship?.id === scholarship.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-border-subtle hover:border-border-default"
                    }`}
                    onClick={() => setSelectedScholarship(scholarship)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{scholarship.name}</p>
                          {selectedScholarship?.id === scholarship.id && (
                            <CheckCircle className="h-4 w-4 text-primary-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getScholarshipBasisLabel(scholarship.basis)}
                          </Badge>
                          <span className="text-sm text-success font-medium">
                            {formatScholarshipValue(scholarship)}
                          </span>
                        </div>
                        {scholarship.description && (
                          <p className="text-sm text-text-muted mt-1">
                            {scholarship.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchQuery
                      ? "No scholarships match your search"
                      : "No scholarships available to assign"}
                  </p>
                </div>
              )}
            </div>

            {/* Remarks */}
            {selectedScholarship && (
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Input
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Reason for assigning this scholarship..."
                  className="mt-2"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignScholarship.isPending || !selectedScholarship}
          >
            {assignScholarship.isPending ? "Assigning..." : "Assign Scholarship"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
