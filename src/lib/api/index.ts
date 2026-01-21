export { apiClient } from "./client";
export { useDashboard, useEnhancedDashboard, dashboardKeys } from "./dashboard";
export { useStudents, useStudent, useCreateStudent, useUpdateStudent, useDeleteStudent, studentsKeys } from "./students";
export { useBatches, useCreateBatch, useUpdateBatch, batchesKeys } from "./batches";
export { useAttendance, useMarkAttendance, attendanceKeys } from "./attendance";
export {
  useFeePlans,
  usePendingFees,
  useStudentFees,
  useCreateFeePlan,
  useAssignFee,
  useRecordPayment,
  useReceipts,
  useReceipt,
  useSendReceiptViaWhatsApp,
  downloadReceiptPDF,
  feesKeys,
} from "./fees";
export type { ReceiptsParams } from "./fees";
export { useProfile, useUpdateProfile, profileKeys } from "./profile";
export {
  useOrganization,
  useUpdateOrganization,
  useMessageTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  settingsKeys,
} from "./settings";
export type {
  Organization,
  UpdateOrganizationInput,
  MessageTemplate,
  UpdateTemplateInput,
  CreateTemplateInput,
} from "./settings";
export {
  createQueryClient,
  isForbiddenError,
  isUnauthorizedError,
  isNotFoundError,
  getErrorMessage,
} from "./query-client";

// Staff
export {
  useStaffList,
  useStaff,
  useDepartments,
  useUpdateStaffProfile,
  useMyTodayAttendance,
  useTodayAttendanceSummary,
  useUnmarkedStaff,
  useStaffAttendanceHistory,
  useCheckIn,
  useCheckOut,
  useMarkStaffAttendance,
  staffKeys,
} from "./staff";
export type { StaffListParams, StaffAttendanceListParams } from "./staff";

// Payment Links
export {
  usePaymentLinks,
  usePaymentLink,
  useCreatePaymentLink,
  useCancelPaymentLink,
  usePublicPaymentLink,
  paymentLinkKeys,
} from "./payments";

// Reports
export {
  useReportTypes,
  useReports,
  useReport,
  useRequestReport,
  useDeleteReport,
  getReportDownloadUrl,
  reportsKeys,
} from "./reports";

// Exams
export {
  useExams,
  useExam,
  useStudentsForMarks,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
  useSaveScores,
  useStudentReportCard,
  downloadReportCardPDF,
  examsKeys,
} from "./exams";

// Messaging
export {
  useUnreadCount,
  useConversations,
  useConversation,
  useCreateConversation,
  useSendMessage,
  useCreateBroadcast,
  messagingKeys,
} from "./messaging";

// Complaints
export {
  useComplaintStats,
  useComplaints,
  useComplaint,
  useCreateComplaint,
  useUpdateComplaint,
  useAddComment,
  complaintsKeys,
} from "./complaints";

// Analytics
export {
  useBranchComparison,
  useBranchPerformance,
  useOrgStats,
  analyticsKeys,
} from "./analytics";

// Scholarships
export {
  useScholarships,
  useAllScholarships,
  useScholarship,
  useCreateScholarship,
  useUpdateScholarship,
  useDeleteScholarship,
  useStudentScholarships,
  useAssignScholarship,
  useRemoveStudentScholarship,
  scholarshipsKeys,
} from "./scholarships";
export type { ScholarshipsParams } from "./scholarships";

// Fee Components & Structure
export {
  useFeeComponents,
  useAllFeeComponents,
  useCreateFeeComponent,
  useUpdateFeeComponent,
  useDeleteFeeComponent,
  useBatchFeeStructures,
  useBatchFeeStructureByBatch,
  useCreateBatchFeeStructure,
  useApplyBatchFeeStructure,
  useStudentFeeStructure,
  useStudentFeeStructureById,
  useCreateStudentFeeStructure,
  useStudentFeeSummary,
  useEMITemplates,
  useCreateEMITemplate,
  usePendingInstallments,
  useStudentInstallments,
  useGenerateInstallments,
  useRecordInstallmentPayment,
  useDeleteInstallments,
  feeComponentsKeys,
  batchFeeStructureKeys,
  studentFeeStructureKeys,
  emiTemplateKeys,
  installmentsKeys,
} from "./installments";
export type { FeeComponentsParams, PendingInstallmentsParams } from "./installments";

// Health
export {
  useStudentHealth,
  useUpdateStudentHealth,
  useHealthCheckups,
  useCreateHealthCheckup,
  useDeleteHealthCheckup,
  healthKeys,
} from "./health";