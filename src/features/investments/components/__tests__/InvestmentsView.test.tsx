import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InvestmentsView } from "../InvestmentsView";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit, Bank } from "@/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock DepositCard to expose settle/delete/close/reopen as plain buttons.
// This isolates InvestmentsView's handler→toast logic from DepositCard's
// Radix DropdownMenu, which requires real pointer events to open in jsdom.
vi.mock("../DepositCard", () => ({
  DepositCard: ({
    summary,
    onSettleClick,
    onDeleteClick,
    onCloseClick,
    onReopenClick,
  }: {
    summary: EnrichedSummary;
    onSettleClick: (s: EnrichedSummary) => void;
    onDeleteClick: (id: string) => void;
    onUnsettleClick: (id: string) => void;
    onCloseClick: (s: EnrichedSummary) => void;
    onReopenClick: (id: string) => void;
    onEditClick: (deposit: TimeDeposit) => void;
    isNew?: boolean;
  }) => (
    <div>
      <button
        aria-label={`Settle ${summary.deposit.name}`}
        onClick={() => onSettleClick(summary)}
      >
        Settle
      </button>
      <button
        aria-label={`Delete ${summary.deposit.name}`}
        onClick={() => onDeleteClick(summary.deposit.id)}
      >
        Delete
      </button>
      <button
        aria-label={`Close ${summary.deposit.name}`}
        onClick={() => onCloseClick(summary)}
      >
        Close
      </button>
      <button
        aria-label={`Reopen ${summary.deposit.name}`}
        onClick={() => onReopenClick(summary.deposit.id)}
      >
        Reopen
      </button>
    </div>
  ),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const deposit: TimeDeposit = {
  id: "dep-1",
  bankId: "bank-1",
  name: "My Bank TD",
  principal: 100_000,
  startDate: "2025-01-01",
  termMonths: 12,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  flatRate: 0.065,
  tiers: [],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  status: "active",
};

const bank: Bank = { id: "bank-1", name: "Test Bank", taxRate: 0.2 };

const summary: EnrichedSummary = {
  deposit,
  bank,
  maturityDate: "2026-01-01",
  grossInterest: 6_500,
  netInterest: 5_200,
  grossTotal: 106_500,
  netTotal: 105_200,
  effectiveStatus: "matured",
};

function renderView(overrides?: Partial<Parameters<typeof InvestmentsView>[0]>) {
  const defaults = {
    summaries: [summary],
    onSettle: vi.fn(),
    onUnsettle: vi.fn(),
    onClose: vi.fn(),
    onReopen: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onRollOver: vi.fn(),
    highlightedId: null,
  };
  return render(
    <PortfolioProvider>
      <InvestmentsView {...defaults} {...overrides} />
    </PortfolioProvider>,
  );
}

// ─── Settle ───────────────────────────────────────────────────────────────────

describe("InvestmentsView — settle toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "{name} marked as settled" toast after confirming settle', async () => {
    const { toast } = await import("sonner");
    const onSettle = vi.fn();
    renderView({ onSettle });

    fireEvent.click(screen.getByRole("button", { name: /settle my bank td/i }));

    // The dialog confirm button text includes the formatted total — find it via the dialog
    const allSettle = screen.getAllByRole("button", { name: /settle/i });
    fireEvent.click(allSettle[allSettle.length - 1]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "My Bank TD marked as settled",
        expect.objectContaining({ action: expect.objectContaining({ label: "Undo" }) }),
      );
    });
    expect(onSettle).toHaveBeenCalledWith("dep-1");
  });
});

// ─── Close ────────────────────────────────────────────────────────────────────

describe("InvestmentsView — close toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "{name} closed" toast after confirming close', async () => {
    const { toast } = await import("sonner");
    const onClose = vi.fn();
    const activeSummary: EnrichedSummary = { ...summary, effectiveStatus: "active" };
    renderView({ summaries: [activeSummary], onClose });

    fireEvent.click(screen.getByRole("button", { name: /close my bank td/i }));

    // Confirm in the CloseConfirmDialog
    const confirmBtn = await screen.findByRole("button", { name: /close account/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "My Bank TD closed",
        expect.objectContaining({ action: expect.objectContaining({ label: "Undo" }) }),
      );
    });
    expect(onClose).toHaveBeenCalledWith("dep-1", expect.any(String));
  });
});

// ─── Reopen ───────────────────────────────────────────────────────────────────

describe("InvestmentsView — reopen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onReopen with deposit id when reopen button is clicked", () => {
    const onReopen = vi.fn();
    const closedSummary: EnrichedSummary = {
      ...summary,
      deposit: { ...deposit, status: "closed", closeDate: "2025-11-01" },
      effectiveStatus: "closed",
    };
    renderView({ summaries: [closedSummary], onReopen });

    // Closed deposits are hidden by default — toggle "Show closed / settled" first
    fireEvent.click(screen.getByRole("switch"));

    fireEvent.click(screen.getByRole("button", { name: /reopen my bank td/i }));
    expect(onReopen).toHaveBeenCalledWith("dep-1");
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe("InvestmentsView — delete toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "{name} deleted" toast after confirming delete', async () => {
    const { toast } = await import("sonner");
    const onDelete = vi.fn();
    renderView({ onDelete });

    fireEvent.click(screen.getByRole("button", { name: /delete my bank td/i }));

    // Confirm in the DeleteConfirmDialog
    const confirmBtn = await screen.findByRole("button", {
      name: /delete my bank td/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("My Bank TD deleted");
    });
    expect(onDelete).toHaveBeenCalledWith("dep-1");
  });
});
