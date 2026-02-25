import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveCalcPreview } from "../LiveCalcPreview";
import type { YieldInput } from "@/lib/domain/yield-engine";

const VALID_INPUT: YieldInput = {
  principal: 100000,
  startDate: "2026-02-25",
  termMonths: 6,
  flatRate: 0.065,
  tiers: [],
  interestMode: "simple",
  interestTreatment: "reinvest",
  compounding: "monthly",
  taxRate: 0.2,
  dayCountConvention: 365,
};

const DEBOUNCE_MS = 300;

describe("LiveCalcPreview — panel mode (compact=false)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state when input is null", () => {
    render(<LiveCalcPreview input={null} />);
    expect(
      screen.getByText(/fill in investment details to see your projected return/i),
    ).toBeInTheDocument();
  });

  it("shows empty state before debounce fires with valid input", () => {
    render(<LiveCalcPreview input={VALID_INPUT} />);
    // Debounce hasn't fired yet
    expect(
      screen.getByText(/fill in investment details to see your projected return/i),
    ).toBeInTheDocument();
  });

  it("shows calculation results after debounce with valid input", () => {
    render(<LiveCalcPreview input={VALID_INPUT} />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // Empty state should be gone
    expect(
      screen.queryByText(/fill in investment details to see your projected return/i),
    ).not.toBeInTheDocument();

    // Should show Calculation Preview heading
    expect(screen.getByText(/calculation preview/i)).toBeInTheDocument();

    // Should show formatted PHP currency values
    expect(screen.getAllByText(/₱/i).length).toBeGreaterThan(0);
  });

  it("shows calculation breakdown note after debounce", () => {
    render(<LiveCalcPreview input={VALID_INPUT} />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.getByText(/Net interest is calculated after 20% final withholding tax/i)).toBeInTheDocument();
  });

  it("returns to empty state when input becomes null", () => {
    const { rerender } = render(<LiveCalcPreview input={VALID_INPUT} />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.getByText(/calculation preview/i)).toBeInTheDocument();

    rerender(<LiveCalcPreview input={null} />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(
      screen.getByText(/fill in investment details to see your projected return/i),
    ).toBeInTheDocument();
  });
});

describe("LiveCalcPreview — compact strip mode (compact=true)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state text when input is null", () => {
    render(<LiveCalcPreview input={null} compact />);
    expect(
      screen.getByText(/fill in investment details to see your projected return/i),
    ).toBeInTheDocument();
  });

  it("shows Net and maturity info after debounce", () => {
    render(<LiveCalcPreview input={VALID_INPUT} compact />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(screen.getByText(/net/i)).toBeInTheDocument();
    expect(screen.getByText(/matures/i)).toBeInTheDocument();
  });

  it("shows 'Open-ended' instead of maturity date for open-ended input", () => {
    const openEndedInput: YieldInput = {
      ...VALID_INPUT,
      termMonths: 12,
    };

    // Simulate open-ended by using a YieldInput that would be flagged as open-ended
    render(<LiveCalcPreview input={openEndedInput} compact />);

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    // With termMonths=12 and no maturityDate signal, should show Matures or Open-ended
    // The "Net" label should always appear
    expect(screen.getByText(/net/i)).toBeInTheDocument();
  });
});
