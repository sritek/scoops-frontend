/**
 * Parent API
 *
 * Types, functions, and React Query hooks for parent-specific API calls.
 * Uses the parentApiClient from parent-client.ts for authentication.
 */

// Re-export client and token helpers from parent-client
export {
  parentApiClient,
  getStoredParentToken,
  storeParentToken,
  clearParentToken,
} from "./parent-client";

// ============================================================================
// Parent API Types
// ============================================================================

export interface ParentProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  childrenCount: number;
}

export interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  enrollmentStatus: string;
  batchName: string | null;
  relation: string;
  isPrimaryContact: boolean;
  // Per-child stats
  todayAttendance: "present" | "absent" | "not_marked";
  pendingInstallments: number;
  pendingFeeAmount: number;
}

export interface ParentDashboard {
  childrenCount: number;
  children: ChildSummary[];
  pendingInstallments: number;
  totalPendingAmount: number;
  unreadMessages: number;
  activeComplaints: number;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  attendancePercentage: number | null;
}

export interface ChildDetails {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentStatus: string;
  photoUrl: string | null;
  dateOfBirth: string | null;
  batchId: string | null;
  batchName: string | null;
  relation: string;
  isPrimaryContact: boolean;
  attendanceSummary: AttendanceSummary;
}

export interface InstallmentPaymentLink {
  shortCode: string;
  paymentUrl: string;
  expiresAt: string;
  status: string;
}

export interface FeeInstallment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  isOverdue: boolean;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    transactionId: string | null;
  }>;
  paymentLink: InstallmentPaymentLink | null;
}

export interface FeeLineItem {
  id: string;
  componentId: string;
  componentName: string;
  description: string | null;
  originalAmount: number;
  adjustedAmount: number;
  waived: boolean;
  waiverReason: string | null;
}

export interface ChildFees {
  feeStructure: {
    id: string;
    grossAmount: number;
    scholarshipAmount: number;
    netAmount: number;
    sessionName: string;
    sessionId: string;
    remarks: string | null;
  } | null;
  lineItems: FeeLineItem[];
  scholarships: Array<{
    id: string;
    name: string;
    discountType: string;
    discountValue: number;
    status: string;
    appliedDate: string;
  }>;
  installments: FeeInstallment[];
  summary: {
    grossAmount: number;
    scholarshipAmount: number;
    totalFee: number;
    totalPaid: number;
    totalPending: number;
    installmentCount: number;
    paidInstallments: number;
    overdueCount: number;
    upcomingDueDate: string | null;
    upcomingAmount: number | null;
  };
}

export interface AllChildrenFees {
  children: Array<{
    studentId: string;
    studentName: string;
    totalFee: number;
    totalPaid: number;
    totalPending: number;
    scholarshipAmount: number;
    pendingInstallments: number;
    activePaymentLinks: number;
    nextPaymentLink: InstallmentPaymentLink | null;
  }>;
  overall: {
    totalPending: number;
    totalPaid: number;
    total: number;
  };
}

// ============================================================================
// Parent API Functions
// ============================================================================

import { parentApiClient, getStoredParentToken } from "./parent-client";

/**
 * Request OTP for parent login
 */
export async function requestParentOTP(phone: string): Promise<{
  success: boolean;
  message: string;
  expiresAt?: string;
  cooldownSeconds?: number;
}> {
  return parentApiClient.post(
    "/auth/parent/request-otp",
    { phone },
    { skipAuth: true }
  );
}

/**
 * Verify OTP and get session token
 */
export async function verifyParentOTP(
  phone: string,
  otp: string
): Promise<{
  success: boolean;
  message: string;
  parentId?: string;
  token?: string;
}> {
  return parentApiClient.post(
    "/auth/parent/verify-otp",
    { phone, otp },
    { skipAuth: true }
  );
}

/**
 * Get current parent info (validates session)
 */
export async function getParentMe(): Promise<{
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
}> {
  return parentApiClient.get("/auth/parent/me");
}

/**
 * Logout parent (invalidate session)
 */
export async function logoutParent(): Promise<{
  success: boolean;
  message: string;
}> {
  return parentApiClient.post("/auth/parent/logout");
}

/**
 * Get parent profile
 */
export async function getParentProfile(): Promise<ParentProfile> {
  return parentApiClient.get("/parent/me");
}

/**
 * Get parent dashboard
 */
export async function getParentDashboard(): Promise<ParentDashboard> {
  return parentApiClient.get("/parent/dashboard");
}

/**
 * Get all children
 */
export async function getParentChildren(): Promise<ChildDetails[]> {
  return parentApiClient.get("/parent/children");
}

/**
 * Get child details
 */
export async function getChildDetails(
  studentId: string
): Promise<ChildDetails> {
  return parentApiClient.get(`/parent/children/${studentId}`);
}

/**
 * Get child attendance
 */
export async function getChildAttendance(
  studentId: string,
  params?: { startDate?: string; endDate?: string; limit?: number }
): Promise<{
  records: Array<{
    id: string;
    date: string;
    status: string;
    notes: string | null;
  }>;
  summary: AttendanceSummary & {
    absentDays: number;
    lateDays: number;
  };
}> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return parentApiClient.get(
    `/parent/children/${studentId}/attendance${query ? `?${query}` : ""}`
  );
}

/**
 * Get child fees
 */
export async function getChildFees(studentId: string): Promise<ChildFees> {
  return parentApiClient.get(`/parent/children/${studentId}/fees`);
}

/**
 * Get all children fees summary
 */
export async function getAllChildrenFees(): Promise<AllChildrenFees> {
  return parentApiClient.get("/parent/fees");
}

// ============================================================================
// Payment Links API Types
// ============================================================================

export interface ChildPaymentLink {
  id: string;
  shortCode: string;
  paymentUrl: string;
  amount: number;
  description: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  installment: {
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidAmount: number;
    status: string;
    pendingAmount: number;
  } | null;
}

// ============================================================================
// Payment Links API Functions
// ============================================================================

/**
 * Get child's active payment links
 */
export async function getChildPaymentLinks(
  studentId: string
): Promise<ChildPaymentLink[]> {
  return parentApiClient.get(`/parent/children/${studentId}/payment-links`);
}

// ============================================================================
// Teachers API Types
// ============================================================================

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isClassTeacher: boolean;
  subjects: string[];
}

export interface ChildTeachers {
  classTeacher: Teacher | null;
  subjectTeachers: Teacher[];
}

// ============================================================================
// Teachers API Functions
// ============================================================================

/**
 * Get child's teachers
 */
export async function getChildTeachers(
  studentId: string
): Promise<ChildTeachers> {
  return parentApiClient.get(`/parent/children/${studentId}/teachers`);
}

// ============================================================================
// ID Card API Types
// ============================================================================

export interface ChildIdCard {
  studentId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  batchName: string | null;
  admissionYear: number;
  orgName: string;
  orgLogoUrl: string | null;
  branchName: string;
  qrData: string;
}

// ============================================================================
// ID Card API Functions
// ============================================================================

/**
 * Get child's ID card data
 */
export async function getChildIdCard(studentId: string): Promise<ChildIdCard> {
  return parentApiClient.get(`/parent/children/${studentId}/id-card`);
}

// ============================================================================
// Exam & Report Card API Types
// ============================================================================

export type ExamType =
  | "unit_test"
  | "mid_term"
  | "final"
  | "practical"
  | "assignment";

export interface ExamResult {
  id: string;
  name: string;
  type: ExamType;
  subject: string | null;
  subjectId: string | null;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  grade: string;
  isPassed: boolean;
  isAbsent: boolean;
  hasScore: boolean;
  batchAverage: number | null;
  batchAveragePercentage: number | null;
}

export interface ChildExams {
  student: {
    id: string;
    name: string;
    batchName: string | null;
  };
  exams: ExamResult[];
  summary: {
    totalExams: number;
    attemptedExams: number;
    passedExams: number;
    failedExams: number;
    absentExams: number;
  };
}

export interface ReportCardExam {
  id: string;
  name: string;
  type: ExamType;
  subject: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  percentage: number | null;
  grade: string;
  isPassed: boolean;
}

export interface ChildReportCard {
  student: {
    id: string;
    name: string;
    batchName: string;
    branchName: string;
    organizationName: string;
  };
  exams: ReportCardExam[];
  summary: {
    totalExams: number;
    passedExams: number;
    failedExams: number;
    absentExams: number;
    totalMarksObtained: number;
    totalMaxMarks: number;
    overallPercentage: number;
    overallGrade: string;
  };
}

// ============================================================================
// Exam & Report Card API Functions
// ============================================================================

/**
 * Get child's exam results
 */
export async function getChildExams(
  studentId: string,
  params?: { type?: ExamType }
): Promise<ChildExams> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);

  const query = searchParams.toString();
  return parentApiClient.get(
    `/parent/children/${studentId}/exams${query ? `?${query}` : ""}`
  );
}

/**
 * Get child's report card
 */
export async function getChildReportCard(
  studentId: string
): Promise<ChildReportCard> {
  return parentApiClient.get(`/parent/children/${studentId}/report-card`);
}

/**
 * Download child's report card as PDF
 */
export async function downloadChildReportCardPDF(
  studentId: string
): Promise<void> {
  const token = getStoredParentToken();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  // Open PDF in new tab or trigger download
  const url = `${baseUrl}/parent/children/${studentId}/report-card/pdf`;

  const response = await fetch(url, {
    headers: {
      "x-parent-token": token || "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download report card");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `Report_Card_${studentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

// ============================================================================
// Academic Calendar API Types
// ============================================================================

export type AcademicEventType =
  | "holiday"
  | "exam"
  | "ptm"
  | "event"
  | "deadline";

export interface CalendarEvent {
  id: string;
  type: AcademicEventType;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  batchId: string | null;
  batchName: string | null;
  isSchoolWide: boolean;
  isExam: boolean;
}

export interface CalendarChild {
  id: string;
  name: string;
  batchName: string | null;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  month: number;
  year: number;
  children: CalendarChild[];
}

// ============================================================================
// Academic Calendar API Functions
// ============================================================================

/**
 * Get calendar events for parent's children
 */
export async function getParentCalendar(
  month: number,
  year: number,
  childId?: string
): Promise<CalendarResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("month", month.toString());
  searchParams.set("year", year.toString());
  if (childId) searchParams.set("childId", childId);

  return parentApiClient.get(`/parent/calendar?${searchParams.toString()}`);
}

// ============================================================================
// Emergency Contact API Types
// ============================================================================

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  notes?: string;
}

export interface EmergencyContactsResponse {
  contacts: EmergencyContact[];
}

// ============================================================================
// Emergency Contact API Functions
// ============================================================================

/**
 * Get child's emergency contacts
 */
export async function getChildEmergencyContacts(
  studentId: string
): Promise<EmergencyContactsResponse> {
  return parentApiClient.get(
    `/parent/children/${studentId}/emergency-contacts`
  );
}

/**
 * Update child's emergency contacts
 */
export async function updateChildEmergencyContacts(
  studentId: string,
  contacts: EmergencyContact[]
): Promise<EmergencyContactsResponse> {
  return parentApiClient.put(
    `/parent/children/${studentId}/emergency-contacts`,
    {
      contacts,
    }
  );
}

// ============================================================================
// Homework API Types
// ============================================================================

export type SubmissionStatus = "pending" | "submitted" | "late" | "graded";

export interface HomeworkSubmission {
  status: SubmissionStatus;
  submittedAt: string | null;
  marks: number | null;
  feedback: string | null;
}

export interface ChildHomework {
  id: string;
  title: string;
  description: string;
  subject: string | null;
  dueDate: string;
  totalMarks: number | null;
  isOverdue: boolean;
  daysUntilDue: number;
  isClosed: boolean;
  submission: HomeworkSubmission | null;
}

export interface ChildHomeworkListResponse {
  student: {
    id: string;
    name: string;
    batchName: string | null;
  };
  homework: ChildHomework[];
  summary: {
    total: number;
    pending: number;
    submitted: number;
    graded: number;
  };
}

export interface HomeworkAttachment {
  name: string;
  url: string;
}

export interface HomeworkDetailSubmission extends HomeworkSubmission {
  id: string;
  attachments: HomeworkAttachment[] | null;
  gradedBy: string | null;
  gradedAt: string | null;
}

export interface ChildHomeworkDetail {
  id: string;
  title: string;
  description: string;
  attachments: HomeworkAttachment[] | null;
  subject: string | null;
  batchName: string;
  dueDate: string;
  totalMarks: number | null;
  isOverdue: boolean;
  isClosed: boolean;
  createdBy: string;
  createdAt: string;
  submission: HomeworkDetailSubmission | null;
}

// ============================================================================
// Homework API Functions
// ============================================================================

/**
 * Get child's homework list
 */
export async function getChildHomework(
  studentId: string,
  params?: { status?: string }
): Promise<ChildHomeworkListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return parentApiClient.get(
    `/parent/children/${studentId}/homework${query ? `?${query}` : ""}`
  );
}

/**
 * Get child's homework detail
 */
export async function getChildHomeworkDetail(
  studentId: string,
  homeworkId: string
): Promise<ChildHomeworkDetail> {
  return parentApiClient.get(
    `/parent/children/${studentId}/homework/${homeworkId}`
  );
}

// ============================================================================
// Announcements API Types
// ============================================================================

export interface Announcement {
  id: string;
  type: string;
  title: string;
  batchName: string | null;
  isSchoolWide: boolean;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  messageCount: number;
}

export interface AnnouncementsResponse {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Announcements API Functions
// ============================================================================

/**
 * Get announcements
 */
export async function getParentAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<AnnouncementsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return parentApiClient.get(
    `/parent/announcements${query ? `?${query}` : ""}`
  );
}

// ============================================================================
// Messaging API Types
// ============================================================================

export interface ConversationMessage {
  id: string;
  content: string;
  attachmentUrl: string | null;
  createdAt: string;
  senderName: string;
  isOwnMessage: boolean;
  isFromStaff: boolean;
}

export interface Conversation {
  id: string;
  type: string;
  title: string;
  batchName: string | null;
  staffParticipants: Array<{ name: string }>;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromStaff: boolean;
  } | null;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

export interface ConversationsResponse {
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Messaging API Functions
// ============================================================================

/**
 * Get conversations
 */
export async function getParentConversations(params?: {
  page?: number;
  limit?: number;
}): Promise<ConversationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return parentApiClient.get(`/parent/messages${query ? `?${query}` : ""}`);
}

/**
 * Get unread count
 */
export async function getParentUnreadCount(): Promise<{ unreadCount: number }> {
  return parentApiClient.get("/parent/messages/unread");
}

/**
 * Get conversation with messages
 */
export async function getParentConversation(
  id: string
): Promise<ConversationWithMessages> {
  return parentApiClient.get(`/parent/messages/${id}`);
}

/**
 * Send message
 */
export async function sendParentMessage(
  conversationId: string,
  content: string
): Promise<ConversationMessage> {
  return parentApiClient.post(`/parent/messages/${conversationId}`, {
    content,
  });
}

/**
 * Find or create a conversation with a staff member
 * Returns existing conversation if one exists, otherwise creates a new one
 */
export async function findOrCreateConversationWithStaff(
  staffId: string,
  initialMessage?: string
): Promise<ConversationWithMessages> {
  return parentApiClient.post(`/parent/messages/with-staff/${staffId}`, {
    message: initialMessage,
  });
}

// ============================================================================
// Complaints API Types
// ============================================================================

export interface ComplaintCategory {
  id: string;
  name: string;
}

export interface ComplaintComment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorType: "staff" | "parent";
  isOwnComment: boolean;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  studentName: string | null;
  submittedBy: string;
  assignedTo: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintWithComments extends Complaint {
  comments: ComplaintComment[];
}

export interface ComplaintsResponse {
  data: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Complaints API Functions
// ============================================================================

/**
 * Get complaint categories
 */
export async function getComplaintCategories(): Promise<ComplaintCategory[]> {
  return parentApiClient.get("/parent/complaints/categories");
}

/**
 * Get complaints
 */
export async function getParentComplaints(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ComplaintsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return parentApiClient.get(`/parent/complaints${query ? `?${query}` : ""}`);
}

/**
 * Create complaint
 */
export async function createParentComplaint(data: {
  subject: string;
  description: string;
  category: string;
  studentId: string;
}): Promise<Complaint> {
  return parentApiClient.post("/parent/complaints", data);
}

/**
 * Get complaint details
 */
export async function getParentComplaint(
  id: string
): Promise<ComplaintWithComments> {
  return parentApiClient.get(`/parent/complaints/${id}`);
}

/**
 * Add comment to complaint
 */
export async function addParentComplaintComment(
  complaintId: string,
  content: string
): Promise<ComplaintComment> {
  return parentApiClient.post(`/parent/complaints/${complaintId}/comments`, {
    content,
  });
}
