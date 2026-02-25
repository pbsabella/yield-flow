import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import type { CurrentMonthBreakdown, NextMaturity } from "@/features/dashboard/hooks/usePortfolioData";

const emptyBreakdown: CurrentMonthBreakdown = { net: 0, pendingNet: 0, settledNet: 0 };

describe("KpiCards — Total Principal", () => {
  it("renders total principal formatted as PHP currency", () => {
    render(
      <KpiCards
        totalPrincipal={500000}
        currentMonthBreakdown={emptyBreakdown}
        nextMaturity={null}
      />,
    );
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
  });

  it("renders the 'Excludes settled' subtext", () => {
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={emptyBreakdown}
        nextMaturity={null}
      />,
    );
    expect(screen.getByText(/Excludes settled/)).toBeInTheDocument();
  });
});

describe("KpiCards — Income This Month", () => {
  it("renders net income for the current month", () => {
    const breakdown: CurrentMonthBreakdown = { net: 12500, pendingNet: 0, settledNet: 0 };
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={breakdown}
        nextMaturity={null}
      />,
    );
    expect(screen.getByText(/12,500/)).toBeInTheDocument();
  });

  it("shows pending and settled pills when both are non-zero", () => {
    const breakdown: CurrentMonthBreakdown = { net: 3000, pendingNet: 2000, settledNet: 1000 };
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={breakdown}
        nextMaturity={null}
      />,
    );
    expect(screen.getByText(/pending/)).toBeInTheDocument();
    // Badge contains "₱1,000 settled" — use data-slot to scope to badge elements
    const badges = document.querySelectorAll("[data-slot='badge']");
    const settledBadge = Array.from(badges).find((b) => b.textContent?.includes("settled"));
    expect(settledBadge).toBeTruthy();
  });

  it("shows pending pill but hides settled pill when settledNet is zero", () => {
    const breakdown: CurrentMonthBreakdown = { net: 2000, pendingNet: 2000, settledNet: 0 };
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={breakdown}
        nextMaturity={null}
      />,
    );
    // hasPills = true because pendingNet > 0; pending badge renders
    expect(screen.getByText(/pending/)).toBeInTheDocument();
    // settled badge does NOT render when settledNet = 0
    const badges = document.querySelectorAll("[data-slot='badge']");
    const settledBadge = Array.from(badges).find((b) => b.textContent?.includes("settled"));
    expect(settledBadge).toBeFalsy();
  });
});

describe("KpiCards — Next Maturity", () => {
  it("shows a dash when there is no upcoming maturity", () => {
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={emptyBreakdown}
        nextMaturity={null}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows deposit name and bank when nextMaturity is provided", () => {
    const nextMaturity: NextMaturity = {
      depositId: "dep-1",
      name: "Tonik 6M TD",
      bankName: "Tonik Bank",
      maturityDate: "2026-06-01",
      netProceeds: 105000,
    };
    render(
      <KpiCards
        totalPrincipal={0}
        currentMonthBreakdown={emptyBreakdown}
        nextMaturity={nextMaturity}
      />,
    );
    expect(screen.getByText("Tonik 6M TD")).toBeInTheDocument();
    expect(screen.getByText(/Tonik Bank/)).toBeInTheDocument();
    expect(screen.getByText(/105,000/)).toBeInTheDocument();
  });
});
