import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { TrendingUp } from "lucide-react";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState icon={TrendingUp} title="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState
        icon={TrendingUp}
        title="Empty"
        description="Add something to get started"
      />,
    );
    expect(screen.getByText("Add something to get started")).toBeInTheDocument();
  });

  it("omits description text when not provided", () => {
    render(<EmptyState icon={TrendingUp} title="Empty" />);
    // The title is in a <p> but the optional description text should not appear
    expect(screen.queryByText("Add something to get started")).not.toBeInTheDocument();
  });

  it("renders an action button when action prop is provided", () => {
    render(
      <EmptyState
        icon={TrendingUp}
        title="Empty"
        action={{ label: "Add something" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Add something" })).toBeInTheDocument();
  });

  it("omits action button when action is not provided", () => {
    render(<EmptyState icon={TrendingUp} title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onClick when action button is clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={TrendingUp}
        title="Empty"
        action={{ label: "Click me", onClick }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the action button when disabled=true", () => {
    render(
      <EmptyState
        icon={TrendingUp}
        title="Empty"
        action={{ label: "Disabled", disabled: true }}
      />,
    );
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("marks the icon as aria-hidden", () => {
    const { container } = render(<EmptyState icon={TrendingUp} title="Test" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
