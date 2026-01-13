import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BatchesPage from "../page";
import type { Batch } from "@/types/batch";
import type { PaginatedResponse } from "@/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/batches",
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

// Mock the batches API
const mockBatchesData = vi.fn();
const mockCreateBatch = vi.fn();
vi.mock("@/lib/api/batches", () => ({
  useBatches: () => mockBatchesData(),
  useCreateBatch: () => ({
    mutate: mockCreateBatch,
    isPending: false,
    error: null,
  }),
  batchesKeys: {
    all: ["batches"],
    list: (params?: unknown) => ["batches", "list", params],
  },
}));

// Sample batch data
const sampleBatches: Batch[] = [
  {
    id: "batch-1",
    orgId: "org-1",
    branchId: "branch-1",
    name: "Class 10-A",
    academicLevel: "secondary",
    stream: null,
    teacherId: "teacher-1",
    teacher: {
      id: "teacher-1",
      firstName: "Mr",
      lastName: "Smith",
      fullName: "Mr Smith",
    },
    studentCount: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to create paginated response
function createPaginatedResponse(
  data: Batch[],
  page = 1,
  total?: number
): PaginatedResponse<Batch> {
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

describe("BatchesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchesData.mockReturnValue({
      data: createPaginatedResponse(sampleBatches),
      isLoading: false,
      error: null,
    });
    // Default to no permissions
    mockCan.mockReturnValue(false);
  });

  describe("Permission-gated UI - Admin vs Teacher vs Staff", () => {
    it("shows 'Create Batch' button when user has BATCH_CREATE permission (admin)", () => {
      mockCan.mockImplementation((permission: string) => permission === "BATCH_CREATE");

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: /create batch/i })).toBeInTheDocument();
    });

    it("hides 'Create Batch' button when user lacks BATCH_CREATE permission (teacher)", () => {
      mockCan.mockReturnValue(false);

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole("button", { name: /create batch/i })).not.toBeInTheDocument();
    });

    it("hides 'Create Batch' button for staff users without create permissions", () => {
      mockCan.mockReturnValue(false);

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole("button", { name: /create batch/i })).not.toBeInTheDocument();
    });
  });

  describe("Loading and Empty States", () => {
    it("shows loading spinner when data is loading", () => {
      mockBatchesData.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      // Spinner has role="status"
      const spinners = screen.getAllByRole("status");
      expect(spinners.length).toBeGreaterThan(0);
    });

    it("shows empty state when no batches exist", () => {
      mockBatchesData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no batches yet/i)).toBeInTheDocument();
    });

    it("shows error state when fetch fails", () => {
      mockBatchesData.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load batches/i)).toBeInTheDocument();
    });
  });

  describe("Data Display", () => {
    it("renders batches in a table", () => {
      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Class 10-A")).toBeInTheDocument();
    });

    it("shows teacher name when assigned", () => {
      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Mr Smith")).toBeInTheDocument();
    });

    it("shows student count", () => {
      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("shows item count for single page", () => {
      render(<BatchesPage />, { wrapper: createWrapper() });

      // For single page, shows "1 item" (without "Showing X-Y of Z")
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });
  });

  describe("Empty state with CTA", () => {
    it("shows 'Create Batch' button in empty state when user has BATCH_CREATE permission", () => {
      mockCan.mockImplementation((permission: string) => permission === "BATCH_CREATE");
      mockBatchesData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      // Should have two Create Batch buttons - header and empty state
      const createButtons = screen.getAllByRole("button", { name: /create batch/i });
      expect(createButtons).toHaveLength(2);
    });

    it("hides 'Create Batch' button in empty state when user lacks BATCH_CREATE permission", () => {
      mockCan.mockReturnValue(false);
      mockBatchesData.mockReturnValue({
        data: createPaginatedResponse([]),
        isLoading: false,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      expect(screen.queryByRole("button", { name: /create batch/i })).not.toBeInTheDocument();
    });
  });

  describe("Pagination", () => {
    it("shows pagination controls when there are multiple pages", () => {
      // Create response with more total items than shown
      const paginatedResponse = createPaginatedResponse(sampleBatches, 1, 50);
      mockBatchesData.mockReturnValue({
        data: paginatedResponse,
        isLoading: false,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      // Should show Previous/Next buttons
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("does not show pagination when only one page", () => {
      mockBatchesData.mockReturnValue({
        data: createPaginatedResponse(sampleBatches),
        isLoading: false,
        error: null,
      });

      render(<BatchesPage />, { wrapper: createWrapper() });

      // Should not show Previous/Next buttons for single page
      expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
    });
  });
});
