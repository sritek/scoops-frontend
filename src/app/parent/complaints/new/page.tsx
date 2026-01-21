"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  getComplaintCategories,
  getParentChildren,
  createParentComplaint,
} from "@/lib/api/parent";
import { toast } from "sonner";

/**
 * New Complaint Page
 *
 * Form to submit a new complaint:
 * - Select child
 * - Select category
 * - Enter subject and description
 */
export default function NewComplaintPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    studentId: "",
    category: "",
    subject: "",
    description: "",
  });

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["parent", "complaints", "categories"],
    queryFn: getComplaintCategories,
  });

  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: getParentChildren,
  });

  const createMutation = useMutation({
    mutationFn: createParentComplaint,
    onSuccess: () => {
      toast.success("Complaint submitted successfully");
      router.push("/parent/complaints");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit complaint");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.category || !formData.subject || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    createMutation.mutate(formData);
  };

  const isLoading = loadingCategories || loadingChildren;

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/parent/complaints" className="p-2 hover:bg-bg-app rounded-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent/complaints"
          className="p-2 hover:bg-bg-app rounded-sm transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-primary-600" />
          <h1 className="text-xl font-semibold text-text-primary">
            New Complaint
          </h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Child Select */}
            <div className="space-y-2">
              <Label htmlFor="studentId" required>
                Select Child
              </Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, studentId: value }))
                }
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select a child" />
                </SelectTrigger>
                <SelectContent>
                  {children?.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                      {child.batchName && ` - ${child.batchName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category" required>
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" required>
                Subject
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" required>
                Description
              </Label>
              <textarea
                id="description"
                placeholder="Provide detailed information about your complaint..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={5}
                className="w-full rounded-sm border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Complaint
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
