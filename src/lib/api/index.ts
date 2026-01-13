export { apiClient } from "./client";
export { useDashboard, dashboardKeys } from "./dashboard";
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
  feesKeys,
} from "./fees";
export {
  createQueryClient,
  isForbiddenError,
  isUnauthorizedError,
  isNotFoundError,
  getErrorMessage,
} from "./query-client";