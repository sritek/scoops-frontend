import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  StaffEntity,
  UpdateStaffProfileInput,
  StaffAttendanceRecord,
  MyTodayAttendance,
  TodayAttendanceSummary,
  UnmarkedStaff,
  CheckInOutInput,
  MarkStaffAttendanceInput,
  EmploymentType,
  StaffAttendanceStatus,
} from "@/types/staff";
import type { UserRole } from "@/types/user";
import type { PaginatedResponse, PaginationParams } from "@/types";

/**
 * Extended params for staff list with filters
 */
export interface StaffListParams extends PaginationParams {
  role?: UserRole;
  department?: string;
  employmentType?: EmploymentType;
  isActive?: boolean;
  search?: string;
}

/**
 * Extended params for staff attendance list
 */
export interface StaffAttendanceListParams extends PaginationParams {
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: StaffAttendanceStatus;
}

/**
 * Query keys for staff
 */
export const staffKeys = {
  all: ["staff"] as const,
  list: (params?: StaffListParams) => [...staffKeys.all, "list", params] as const,
  detail: (id: string) => [...staffKeys.all, "detail", id] as const,
  departments: () => [...staffKeys.all, "departments"] as const,
  attendance: {
    all: ["staffAttendance"] as const,
    myToday: () => [...staffKeys.attendance.all, "myToday"] as const,
    today: () => [...staffKeys.attendance.all, "today"] as const,
    unmarked: () => [...staffKeys.attendance.all, "unmarked"] as const,
    list: (params?: StaffAttendanceListParams) =>
      [...staffKeys.attendance.all, "list", params] as const,
  },
};

// =====================
// Staff Directory
// =====================

/**
 * Fetch staff list with filters
 */
async function fetchStaffList(
  params: StaffListParams = {}
): Promise<PaginatedResponse<StaffEntity>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.role) searchParams.set("role", params.role);
  if (params.department) searchParams.set("department", params.department);
  if (params.employmentType) searchParams.set("employmentType", params.employmentType);
  if (params.isActive !== undefined) searchParams.set("isActive", String(params.isActive));
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/staff?${queryString}` : "/staff";

  return apiClient.get<PaginatedResponse<StaffEntity>>(endpoint);
}

/**
 * Fetch single staff member
 */
async function fetchStaff(id: string): Promise<StaffEntity> {
  const response = await apiClient.get<{ data: StaffEntity }>(`/staff/${id}`);
  return response.data;
}

/**
 * Fetch departments list
 */
async function fetchDepartments(): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>("/staff/departments");
  return response.data;
}

/**
 * Update staff profile
 */
async function updateStaffProfile({
  id,
  data,
}: {
  id: string;
  data: UpdateStaffProfileInput;
}): Promise<StaffEntity> {
  const response = await apiClient.put<{ data: StaffEntity; message: string }>(
    `/staff/${id}`,
    data
  );
  return response.data;
}

/**
 * Hook to fetch staff list
 */
export function useStaffList(params: StaffListParams = {}) {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => fetchStaffList(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch single staff member
 */
export function useStaff(id: string | null) {
  return useQuery({
    queryKey: staffKeys.detail(id || ""),
    queryFn: () => fetchStaff(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to fetch departments
 */
export function useDepartments() {
  return useQuery({
    queryKey: staffKeys.departments(),
    queryFn: fetchDepartments,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to update staff profile
 */
export function useUpdateStaffProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffProfile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.id) });
    },
  });
}

// =====================
// Staff Attendance
// =====================

/**
 * Fetch my today's attendance
 */
async function fetchMyTodayAttendance(): Promise<MyTodayAttendance> {
  const response = await apiClient.get<{ data: MyTodayAttendance }>(
    "/staff/attendance/my-today"
  );
  return response.data;
}

/**
 * Fetch today's attendance summary
 */
async function fetchTodayAttendanceSummary(): Promise<TodayAttendanceSummary> {
  const response = await apiClient.get<{ data: TodayAttendanceSummary }>(
    "/staff/attendance/today"
  );
  return response.data;
}

/**
 * Fetch unmarked staff
 */
async function fetchUnmarkedStaff(): Promise<UnmarkedStaff[]> {
  const response = await apiClient.get<{ data: UnmarkedStaff[] }>(
    "/staff/attendance/unmarked"
  );
  return response.data;
}

/**
 * Fetch staff attendance history
 */
async function fetchStaffAttendanceHistory(
  params: StaffAttendanceListParams = {}
): Promise<PaginatedResponse<StaffAttendanceRecord>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.status) searchParams.set("status", params.status);

  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/staff/attendance?${queryString}`
    : "/staff/attendance";

  return apiClient.get<PaginatedResponse<StaffAttendanceRecord>>(endpoint);
}

/**
 * Check in
 */
async function checkIn(data: CheckInOutInput = {}): Promise<StaffAttendanceRecord> {
  const response = await apiClient.post<{ data: StaffAttendanceRecord; message: string }>(
    "/staff/attendance/check-in",
    data
  );
  return response.data;
}

/**
 * Check out
 */
async function checkOut(data: CheckInOutInput = {}): Promise<StaffAttendanceRecord> {
  const response = await apiClient.post<{ data: StaffAttendanceRecord; message: string }>(
    "/staff/attendance/check-out",
    data
  );
  return response.data;
}

/**
 * Mark staff attendance (admin)
 */
async function markStaffAttendance(
  data: MarkStaffAttendanceInput
): Promise<StaffAttendanceRecord> {
  const response = await apiClient.post<{ data: StaffAttendanceRecord; message: string }>(
    "/staff/attendance",
    data
  );
  return response.data;
}

/**
 * Hook to fetch my today's attendance
 */
export function useMyTodayAttendance() {
  return useQuery({
    queryKey: staffKeys.attendance.myToday(),
    queryFn: fetchMyTodayAttendance,
    staleTime: 30 * 1000, // 30 seconds - refresh often
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch today's attendance summary
 */
export function useTodayAttendanceSummary() {
  return useQuery({
    queryKey: staffKeys.attendance.today(),
    queryFn: fetchTodayAttendanceSummary,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch unmarked staff
 */
export function useUnmarkedStaff() {
  return useQuery({
    queryKey: staffKeys.attendance.unmarked(),
    queryFn: fetchUnmarkedStaff,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch staff attendance history
 */
export function useStaffAttendanceHistory(params: StaffAttendanceListParams = {}) {
  return useQuery({
    queryKey: staffKeys.attendance.list(params),
    queryFn: () => fetchStaffAttendanceHistory(params),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to check in
 */
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.attendance.all });
    },
  });
}

/**
 * Hook to check out
 */
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.attendance.all });
    },
  });
}

/**
 * Hook to mark staff attendance (admin)
 */
export function useMarkStaffAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markStaffAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.attendance.all });
    },
  });
}
