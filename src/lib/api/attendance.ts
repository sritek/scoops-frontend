import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { AttendanceResponse, MarkAttendanceInput } from "@/types/attendance";
import type { PaginationParams } from "@/types";

/**
 * Query keys for attendance
 */
export const attendanceKeys = {
  all: ["attendance"] as const,
  byBatchDate: (batchId: string, date: string, params?: PaginationParams) =>
    [...attendanceKeys.all, batchId, date, params] as const,
};

/**
 * Fetch attendance for a batch on a specific date with pagination
 */
async function fetchAttendance(
  batchId: string,
  date: string,
  params: PaginationParams = {}
): Promise<AttendanceResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("batchId", batchId);
  searchParams.set("date", date);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const response = await apiClient.get<AttendanceResponse>(
    `/attendance?${searchParams.toString()}`
  );
  return response;
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
      // Invalidate all attendance queries for this batch and date
      queryClient.invalidateQueries({
        queryKey: ["attendance", data.batchId, data.date],
      });
      // Also invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
