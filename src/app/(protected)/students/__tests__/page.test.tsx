import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StudentsPage from "../page";
import type { Student } from "@/types/student";
import type { PaginatedResponse } from "@/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/students",
}));

// Mock usePermissions hook
const mockCan = vi.fn();
vi.mock("@/lib/hooks", () => ({
  usePermissions: () => ({
    can: mockCan,
    canAny: vi.fn(),
    canAll: vi.fn(),
    groups: {},
  }),
}));

// Mock the students API
const mockStudentsData = vi.fn();
vi.mock("@/lib/api/students", () => ({
  useStudents: () => mockStudentsData(),
  studentsKeys: {
    all: ["students"],
    list: (params?: unknown) => ["students", "list", params],
  },
}));

// Sample student data
const sampleStudents: Student[] = [
  {
    id: "student-1",
    orgId: "org-1",
    branchId: "branch-1",
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    gender: "male",
    dob: "2010-05-15",
    category: "gen",
    isCwsn: false,
    photoUrl: null,
    admissionYear: 2023,
    status: "active",
    batchId: "batch-1",
    batchName: "Class 10-A",
    parents: [
      {
        id: "parent-1",
        firstName: "Jane",
        lastName: "Doe",
        fullName: "Jane Doe",
        phone: "9876543210",
        photoUrl: null,
        relation: "mother",
        isPrimaryContact: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to create paginated response
function createPaginatedResponse(
  data: Student[],
  page = 1,
  total?: number
): PaginatedResponse<Student> {
  const actualTotal = total ?? data.length;
  const limit = 20;
  const totalPages = Math.ceil(actualTotal / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: actualTotal,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("StudentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to successful data fetch with paginated response
    mockStudentsData.mockReturnValue({
      data: createPaginatedResponse(sampleStudents),
      isLoading: false,
      error: null,
    });
    // Default to no permissions
    mockCan.mockReturnValue(false);
  });

  describe("Permission-gated UI", () => {
    it("shows 'Add Student' button when user has STUDENT_CREATE permission", () => {
      mockCan.mockImplementation((permission: string) => permission === "STUDENT_CREATE");

      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole("link", { name: /add student/i })).toBeInTheDocument();
    });

    it("hides 'Add Student' button when user lacks STUDENT_CREATE permission", () => {
      mockCan.mockReturnValue(false);

      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole("link", { name: /add student/i })).not.toBeInTheDocument();
    });
  });

  describe("Loading and Empty States", () => {
    it("shows loading spinner when data is loading", () => {
      mockStudentsData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      // The Spinner has role="status"
      const spinners = screen.getAllByRole("status");
      expect(spinners.length).toBeGreaterThan(0);
    });

    it("shows empty state when no students exist", () => {
      mockStudentsData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no students yet/i)).toBeInTheDocument();
    });

    it("shows error state when fetch fails", () => {
      mockStudentsData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load students/i)).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("renders students in a table", () => {
      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows item count for single page", () => {
      render(<StudentsPage />, { wrapper: createWrapper() });

      // For single page, shows "1 item" (without "Showing X-Y of Z")
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });
  });

  describe("Empty state with CTA", () => {
    it("shows 'Add Student' button in empty state when user has permission", () => {
      mockCan.mockImplementation((permission: string) => permission === "STUDENT_CREATE");
      mockStudentsData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      // Should have two Add Student buttons/links - header and empty state
      const addButtons = screen.getAllByRole("link", { name: /add student/i });
      expect(addButtons).toHaveLength(2);
    });

    it("hides 'Add Student' button in empty state when user lacks permission", () => {
      mockCan.mockReturnValue(false);
      mockStudentsData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole("link", { name: /add student/i })).not.toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("shows pagination controls when there are multiple pages", () => {
      // Create response with more total items than shown
      const paginatedResponse = createPaginatedResponse(sampleStudents, 1, 50);
      mockStudentsData.mockReturnValue({
        data: paginatedResponse,
        isLoading: false,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      // Should show Previous/Next buttons
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("does not show pagination when only one page", () => {
      mockStudentsData.mockReturnValue({
        data: createPaginatedResponse(sampleStudents),
        isLoading: false,
        error: null,
      });

      render(<StudentsPage />, { wrapper: createWrapper() });

      // Should not show Previous/Next buttons for single page
      expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
    });
  });
});
