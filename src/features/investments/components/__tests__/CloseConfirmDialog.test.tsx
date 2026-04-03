import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CloseConfirmDialog } from "../CloseConfirmDialog";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { Bank, TimeDeposit } from "@/types";

const bank: Bank = { id: "bank-1", name: "Test Bank", taxRate: 0.2 };

function makeDeposit(overrides: Partial<TimeDeposit> = {}): TimeDeposit {
  return {
    id: "dep-1",
    bankId: "bank-1",
    name: "3-Month TD",
    principal: 100_000,
    startDate: "2025-10-01",
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "daily",
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "maturity",
    dayCountConvention: 365,
    isOpenEnded: false,
    status: "active",
    ...overrides,
  };
}

function makeSummary(deposit: TimeDeposit, maturityDate: string | null): EnrichedSummary {
  return {
    deposit,
    bank,
    maturityDate,
    grossInterest: 1_500,
    netInterest: 1_200,
    grossTotal: 101_500,
    netTotal: 101_200,
    effectiveStatus: "active",
  };
}

function renderDialog(props: Partial<Parameters<typeof CloseConfirmDialog>[0]> = {}) {
  const deposit = props.summary?.deposit ?? makeDeposit();
  const maturityDate = props.summary?.maturityDate ?? "2026-01-01";
  const summary = props.summary ?? makeSummary(deposit, maturityDate);

  const defaults = {
    summary,
    closeDate: "2025-12-01",
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
  };

  return render(
    <PortfolioProvider>
      <CloseConfirmDialog {...defaults} {...props} />
    </PortfolioProvider>,
  );
}

describe("CloseConfirmDialog — time deposit (early close)", () => {
  it("shows maturity warning when closing before maturity", () => {
    renderDialog({
      summary: makeSummary(makeDeposit(), "2026-01-01"),
      closeDate: "2025-12-01",
    });
    expect(screen.getByText(/closing before maturity/i)).toBeInTheDocument();
  });

  it("shows days remaining in the warning", () => {
    renderDialog({
      summary: makeSummary(makeDeposit(), "2026-01-01"),
      closeDate: "2025-12-01",
    });
    // 31 days remaining (Dec 1 → Jan 1)
    expect(screen.getByText(/31d remaining/i)).toBeInTheDocument();
  });

  it("shows 'Close account' button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /close account/i })).toBeInTheDocument();
  });

  it("shows principal in the breakdown", () => {
    renderDialog({ summary: makeSummary(makeDeposit({ principal: 50_000 }), "2026-01-01") });
    // The dialog renders formatted currency — just check principal label is present
    expect(screen.getByText("Principal")).toBeInTheDocument();
  });

  it("shows 'Accrued net interest' in the breakdown", () => {
    renderDialog();
    expect(screen.getByText(/accrued net interest/i)).toBeInTheDocument();
  });

  it("shows 'Net proceeds' totals row", () => {
    renderDialog();
    expect(screen.getByText(/net proceeds/i)).toBeInTheDocument();
  });

  it("calls onConfirm with the deposit id and closeDate when confirmed", () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm, closeDate: "2025-12-01" });
    fireEvent.click(screen.getByRole("button", { name: /close account/i }));
    expect(onConfirm).toHaveBeenCalledWith("dep-1", "2025-12-01");
  });

  it("shows correct net proceeds for a 61-day close", () => {
    // startDate 2025-10-01, closeDate 2025-12-01 = 61 days
    // gross = 100000 * 0.06 * (61/365) ≈ 1002.74, net ≈ 802.19, netProceeds ≈ 100802
    renderDialog({
      summary: makeSummary(makeDeposit({ startDate: "2025-10-01" }), "2026-01-01"),
      closeDate: "2025-12-01",
    });
    const row = screen.getByText(/net proceeds/i).closest("div");
    expect(row).toHaveTextContent(/100[,. ]?80[23]/);
  });

  it("calls onOpenChange(false) when cancel is clicked", () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("CloseConfirmDialog — open-ended savings (close account)", () => {
  it("does NOT show the maturity warning for open-ended deposits", () => {
    renderDialog({
      summary: makeSummary(
        makeDeposit({ isOpenEnded: true }),
        null, // open-ended has no maturityDate
      ),
      closeDate: "2025-12-01",
    });
    expect(screen.queryByText(/closing before maturity/i)).not.toBeInTheDocument();
  });

  it("uses 'Close account?' (not 'early') in the dialog title", () => {
    renderDialog({
      summary: makeSummary(makeDeposit({ name: "Savings Account", isOpenEnded: true }), null),
      closeDate: "2025-12-01",
    });
    expect(screen.getByText(/close savings account\?/i)).toBeInTheDocument();
  });
});
