import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import DashboardClient from "@/components/DashboardClient";
import { deposits as demoDeposits } from "@/lib/demo";
import { renderWithProviders } from "@/components/__tests__/test-utils";

vi.mock("@/components/dashboard/DepositFormDialog", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/components/dashboard/ConfirmDeleteDialog", () => ({
  default: () => null,
}));

describe("DashboardClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders header and primary actions", () => {
    localStorage.setItem("yieldflow-deposits", JSON.stringify(demoDeposits));
    renderWithProviders(<DashboardClient />);

    expect(screen.getByRole("heading", { name: /yieldflow/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add investment/i })).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cash flow/i })).toBeInTheDocument();
  });

  it("shows empty state with privacy notice", () => {
    renderWithProviders(<DashboardClient />);

    const notices = screen.getAllByText(
      /local-only storage\. no servers, no tracking\./i,
    );
    expect(notices.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /load sample data/i })).toBeInTheDocument();
  });

  it("shows data management and sync status", () => {
    renderWithProviders(<DashboardClient />);

    expect(screen.getByText(/data management/i)).toBeInTheDocument();
    expect(screen.getByText(/saved to browser/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download backup \(json\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all data/i })).toBeInTheDocument();
  });
});
