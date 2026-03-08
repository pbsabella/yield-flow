import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvestmentWizard } from "../InvestmentWizard";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import type { TimeDeposit } from "@/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Keep the wizard form UI simple so tests focus on submit behavior.
vi.mock("../InvestmentForm", () => ({
  InvestmentForm: () => <div data-testid="investment-form" />,
}));
vi.mock("../LiveCalcPreview", () => ({
  LiveCalcPreview: () => <div data-testid="live-calc-preview" />,
}));

const makeDeposit = (overrides?: Partial<TimeDeposit>): TimeDeposit => ({
  id: "dep-1",
  bankId: "test-bank",
  name: "Test Deposit",
  principal: 100_000,
  startDate: "2026-01-01",
  termMonths: 12,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  flatRate: 0.065,
  tiers: [],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  status: "active",
  ...overrides,
});

// Mock useWizardState to make the form always submittable.
vi.mock("@/features/portfolio/hooks/useWizardState", () => ({
  useWizardState: () => ({
    formState: {},
    errors: {},
    warnings: {},
    isDirty: false,
    discardOpen: false,
    setDiscardOpen: vi.fn(),
    setField: vi.fn(),
    touchField: vi.fn(),
    canSubmit: true,
    reset: vi.fn(),
    loadDeposit: vi.fn(),
    deriveYieldInput: () => null,
    buildDeposit: (_id: string) => makeDeposit({ id: _id }),
  }),
}));

function renderWizard(props: Partial<Parameters<typeof InvestmentWizard>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    existingBankNames: [],
  };
  return render(
    <PortfolioProvider>
      <InvestmentWizard {...defaults} {...props} />
    </PortfolioProvider>,
  );
}

describe("InvestmentWizard — add mode toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success with "{name} added" after submitting a new investment', async () => {
    const { toast } = await import("sonner");
    renderWizard();

    fireEvent.click(screen.getByRole("button", { name: /add investment/i }));

    expect(toast.success).toHaveBeenCalledWith("Test Deposit added");
  });
});

describe("InvestmentWizard — edit mode toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls toast.success with "{name} updated" after saving edits', async () => {
    // buildDeposit mock always returns "Test Deposit" as the name.
    const { toast } = await import("sonner");
    renderWizard({ initialDeposit: makeDeposit() });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(toast.success).toHaveBeenCalledWith("Test Deposit updated");
  });
});
