import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccessDenied, AccessDeniedPage } from "../access-denied";
import { Button } from "../button";

describe("AccessDenied", () => {
  it("renders default title and description", () => {
    render(<AccessDenied />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText(/You don't have permission to view this content/)
    ).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <AccessDenied
        title="Cannot Edit Students"
        description="You need STUDENT_EDIT permission"
      />
    );

    expect(screen.getByText("Cannot Edit Students")).toBeInTheDocument();
    expect(
      screen.getByText("You need STUDENT_EDIT permission")
    ).toBeInTheDocument();
  });

  it("does not show action button by default", () => {
    render(<AccessDenied />);
    expect(
      screen.queryByRole("button")
    ).not.toBeInTheDocument();
  });

  it("renders custom action when provided", () => {
    render(
      <AccessDenied
        action={<Button>Request Access</Button>}
      />
    );

    expect(
      screen.getByRole("button", { name: "Request Access" })
    ).toBeInTheDocument();
  });

  it("calls onClick handler when action button is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <AccessDenied
        action={<Button onClick={handleClick}>Go Back</Button>}
      />
    );
    
    await user.click(screen.getByRole("button", { name: "Go Back" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("has correct accessibility attributes", () => {
    render(<AccessDenied />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("renders the shield icon", () => {
    render(<AccessDenied />);
    
    // Icon should be hidden from screen readers
    const icon = document.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});

describe("AccessDeniedPage", () => {
  it("renders with centered layout", () => {
    render(<AccessDeniedPage />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("renders Go Back button when onGoBack is provided", () => {
    const handleGoBack = vi.fn();
    render(<AccessDeniedPage onGoBack={handleGoBack} />);

    expect(
      screen.getByRole("button", { name: "Go Back" })
    ).toBeInTheDocument();
  });

  it("calls onGoBack when Go Back button is clicked", async () => {
    const user = userEvent.setup();
    const handleGoBack = vi.fn();
    
    render(<AccessDeniedPage onGoBack={handleGoBack} />);
    await user.click(screen.getByRole("button", { name: "Go Back" }));
    
    expect(handleGoBack).toHaveBeenCalledTimes(1);
  });
});
