/**
 * Complaint Types
 */

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";
export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export interface Complaint {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  studentName: string | null;
  submittedBy: string;
  assignedTo: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  authorName: string;
  authorType: "staff" | "parent";
}

export interface ComplaintDetail extends Complaint {
  comments: ComplaintComment[];
}

export interface CreateComplaintInput {
  subject: string;
  description: string;
  category: string;
  priority?: ComplaintPriority;
  studentId?: string;
}

export interface UpdateComplaintInput {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedToId?: string | null;
  resolution?: string;
}

export interface AddCommentInput {
  content: string;
  isInternal?: boolean;
}

export interface ComplaintFilters {
  page?: number;
  limit?: number;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: string;
  assignedToId?: string;
}

export interface ComplaintStats {
  total: number;
  byStatus: Record<ComplaintStatus, number>;
  byPriority: Record<ComplaintPriority, number>;
  byCategory: Record<string, number>;
}

export const COMPLAINT_CATEGORIES = [
  { value: "fees", label: "Fees" },
  { value: "academics", label: "Academics" },
  { value: "facilities", label: "Facilities" },
  { value: "staff", label: "Staff" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export const COMPLAINT_STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const COMPLAINT_PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
