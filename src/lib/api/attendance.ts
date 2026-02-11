import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { dashboardKeys } from "./dashboard";
import type {
  AttendanceResponse,
  MarkAttendanceInput,
  AttendanceSummary,
  AttendanceHistoryItem,
  AttendanceHistoryParams,
  StudentAttendanceHistoryResponse,
} from "@/types/attendance";
import type { PaginationParams, PaginatedResponse } from "@/types";

/**
 * Query keys for attendance
 */
export const attendanceKeys = {
  all: ["attendance"] as const,
  byBatchDate: (batchId: string, date: string, params?: PaginationParams) =>
    [...attendanceKeys.all, batchId, date, params] as const,
  summary: () => [...attendanceKeys.all, "summary"] as const,
  history: (params?: AttendanceHistoryParams) =>
    [...attendanceKeys.all, "history", params] as const,
  studentHistory: (
    studentId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) => [...attendanceKeys.all, "student", studentId, params] as const,
};

/**
 * Fetch attendance for a batch on a specific date with pagination
 */
export async function fetchAttendance(
  batchId: string,
  date: string,
  params: PaginationParams = {}
): Promise<AttendanceResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("batchId", batchId);
  searchParams.set("date", date);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await apiClient.get<{ data: AttendanceResponse }>(
    `/attendance?${searchParams.toString()}`
  );
  return response.data;
}

/**
 * Mark attendance for a batch
 */
async function markAttendance(
  input: MarkAttendanceInput
): Promise<AttendanceResponse> {
  const response = await apiClient.post<AttendanceResponse>(
    "/attendance/mark",
    input
  );
  return response;
}

/**
 * Fetch today's attendance summary
 */
async function fetchAttendanceSummary(): Promise<AttendanceSummary> {
  const response = await apiClient.get<{ data: AttendanceSummary }>(
    "/dashboard/attendance"
  );

  return response.data;
}

/**
 * Fetch attendance history with filters
 */
async function fetchAttendanceHistory(
  params: AttendanceHistoryParams = {}
): Promise<PaginatedResponse<AttendanceHistoryItem>> {
  const searchParams = new URLSearchParams();
  if (params.batchId) searchParams.set("batchId", params.batchId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/attendance/history?${queryString}`
    : "/attendance/history";

  return apiClient.get<PaginatedResponse<AttendanceHistoryItem>>(endpoint);
}

/**
 * Fetch per-student attendance history (paginated)
 */
async function fetchStudentAttendanceHistory(
  studentId: string,
  params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<StudentAttendanceHistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/attendance/student/${studentId}/history?${queryString}`
    : `/attendance/student/${studentId}/history`;

  const response = await apiClient.get<{
    data: StudentAttendanceHistoryResponse;
  }>(endpoint);
  return response.data;
}

/**
 * Hook to fetch attendance for a batch on a specific date with pagination
 *
 * @example
 * const { data: attendance, isLoading } = useAttendance(batchId, date, { page: 1, limit: 20 });
 */
export function useAttendance(
  batchId: string | null,
  date: string | null,
  params: PaginationParams = {}
) {
  return useQuery({
    queryKey: attendanceKeys.byBatchDate(batchId || "", date || "", params),
    queryFn: () => fetchAttendance(batchId!, date!, params),
    enabled: !!batchId && !!date,
    staleTime: 30 * 1000, // 30 seconds - attendance data changes frequently
  });
}

/**
 * Hook to mark attendance for a batch
 *
 * @example
 * const { mutate: saveAttendance, isPending } = useMarkAttendance();
 * saveAttendance({ batchId, date, records }, {
 *   onSuccess: () => showSuccess("Attendance saved"),
 *   onError: (error) => showError(error.message),
 * });
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAttendance,
    onSuccess: (data) => {
      // Invalidate attendance queries to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: ["attendance", data.batchId, data.date],
      });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.summary() });

      // Also invalidate dashboard to update summary
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Hook to fetch today's attendance summary
 *
 * @example
 * const { data: summary, isLoading } = useAttendanceSummary();
 */
export function useAttendanceSummary() {
  return useQuery<AttendanceSummary>({
    queryKey: attendanceKeys.summary(),
    queryFn: fetchAttendanceSummary,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch attendance history with pagination and filters
 *
 * @example
 * const { data: history, isLoading } = useAttendanceHistory({ batchId, startDate, endDate, page: 1 });
 */
export function useAttendanceHistory(params: AttendanceHistoryParams = {}) {
  return useQuery({
    queryKey: attendanceKeys.history(params),
    queryFn: () => fetchAttendanceHistory(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch per-student attendance history (paginated)
 */
export function useStudentAttendanceHistory(
  studentId: string | null,
  params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  return useQuery({
    queryKey: attendanceKeys.studentHistory(studentId || "", params),
    queryFn: () => fetchStudentAttendanceHistory(studentId!, params),
    enabled: !!studentId,
    staleTime: 60 * 1000,
  });
}
