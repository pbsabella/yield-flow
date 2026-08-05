import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettleConfirmDialog } from "../SettleConfirmDialog";
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

function makeSummary(deposit: TimeDeposit): EnrichedSummary {
  return {
    deposit,
    bank,
    maturityDate: "2026-01-01",
    grossInterest: 1_500,
    netInterest: 1_200,
    grossTotal: 101_500,
    netTotal: 101_200,
    effectiveStatus: "matured",
  };
}

function renderDialog(props: Partial<Parameters<typeof SettleConfirmDialog>[0]> = {}) {
  const summary = props.summary ?? makeSummary(makeDeposit());
  const defaults = {
    summary,
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    onRenew: vi.fn(),
  };
  return {
    ...render(
      <PortfolioProvider>
        <SettleConfirmDialog {...defaults} {...props} />
      </PortfolioProvider>,
    ),
    summary,
    props: { ...defaults, ...props },
  };
}

describe("SettleConfirmDialog — TD maturity decision", () => {
  it("asks what to do with the deposit by name", () => {
    renderDialog();
    expect(
      screen.getByText("What would you like to do with 3-Month TD?"),
    ).toBeInTheDocument();
  });

  it("shows the proceeds breakdown", () => {
    renderDialog();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Net interest")).toBeInTheDocument();
    expect(screen.getByText("Total proceeds")).toBeInTheDocument();
  });

  it("offers Withdraw, Renew everything, and Renew principal only", () => {
    renderDialog();
    expect(screen.getByLabelText(/withdraw/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/renew everything/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/renew principal only/i)).toBeInTheDocument();
  });

  it("disables Continue until a choice is made", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("calls onConfirm with the deposit id when Withdraw is chosen", () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.click(screen.getByLabelText(/withdraw/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onConfirm).toHaveBeenCalledWith("dep-1");
  });

  it("calls onRenew with mode 'all' when Renew everything is chosen", () => {
    const onRenew = vi.fn();
    renderDialog({ onRenew });
    fireEvent.click(screen.getByLabelText(/renew everything/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onRenew).toHaveBeenCalledWith(expect.anything(), "all");
  });

  it("calls onRenew with mode 'principal-only' when Renew principal only is chosen", () => {
    const onRenew = vi.fn();
    renderDialog({ onRenew });
    fireEvent.click(screen.getByLabelText(/renew principal only/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onRenew).toHaveBeenCalledWith(expect.anything(), "principal-only");
  });

  it("does not fire a callback when Continue is clicked with no selection", () => {
    const onConfirm = vi.fn();
    const onRenew = vi.fn();
    renderDialog({ onConfirm, onRenew });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onRenew).not.toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("starts with no selection when remounted via key (fresh open session)", () => {
    const onConfirm = vi.fn();
    const summary = makeSummary(makeDeposit());
    const { rerender, props } = renderDialog({ summary, onConfirm });

    fireEvent.click(screen.getByLabelText(/withdraw/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onConfirm).toHaveBeenCalledWith("dep-1");

    // The parent keys the dialog by an open-session counter — a new key
    // remounts it and the selection starts null again.
    rerender(
      <PortfolioProvider>
        <SettleConfirmDialog key={2} {...props} />
      </PortfolioProvider>,
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});

describe("SettleConfirmDialog — TD Monthly", () => {
  it("collapses to Withdraw and Renew only", () => {
    renderDialog({ summary: makeSummary(makeDeposit({ payoutFrequency: "monthly" })) });
    expect(screen.getByLabelText(/withdraw/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/renew/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/renew everything/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/renew principal only/i)).not.toBeInTheDocument();
  });

  it("renews with mode 'all' (which resolves to principal only)", () => {
    const onRenew = vi.fn();
    renderDialog({
      summary: makeSummary(makeDeposit({ payoutFrequency: "monthly" })),
      onRenew,
    });
    fireEvent.click(screen.getByLabelText(/^renew/i));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onRenew).toHaveBeenCalledWith(expect.anything(), "all");
  });
});
