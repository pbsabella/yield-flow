import { describe, expect, it, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useWizardStore } from "@/store/wizardStore";
import type { TimeDeposit } from "@/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeDeposit = (overrides?: Partial<TimeDeposit>): TimeDeposit => ({
  id: "dep-1",
  bankId: "Test Bank",
  name: "Test Deposit",
  principal: 100_000,
  startDate: "2026-01-01",
  termMonths: 24,
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

// Reset the store to its initial state before every test so tests are isolated.
beforeEach(() => {
  useWizardStore.setState({
    wizardOpen: false,
    editTarget: null,
    rolloverConfig: null,
    highlightedId: null,
    exportAiOpen: false,
  });
  vi.useRealTimers();
});

// ─── Wizard state ─────────────────────────────────────────────────────────────

describe("wizardStore — wizard state", () => {
  it("wizardOpen is false by default", () => {
    expect(useWizardStore.getState().wizardOpen).toBe(false);
    expect(useWizardStore.getState().editTarget).toBeNull();
  });

  it("openWizard() sets wizardOpen=true with no editTarget", () => {
    act(() => useWizardStore.getState().openWizard());

    expect(useWizardStore.getState().wizardOpen).toBe(true);
    expect(useWizardStore.getState().editTarget).toBeNull();
  });

  it("openWizard(deposit) sets wizardOpen=true and editTarget to the deposit", () => {
    const deposit = makeDeposit();
    act(() => useWizardStore.getState().openWizard(deposit));

    expect(useWizardStore.getState().wizardOpen).toBe(true);
    expect(useWizardStore.getState().editTarget?.id).toBe(deposit.id);
  });

  it("openWizard() clears any existing rolloverConfig", () => {
    useWizardStore.setState({ rolloverConfig: { sourceId: "x", deposit: makeDeposit(), proceedsPrincipal: 100, startDate: "2026-01-01" } });
    act(() => useWizardStore.getState().openWizard());

    expect(useWizardStore.getState().rolloverConfig).toBeNull();
  });

  it("closeWizard() resets wizardOpen=false and clears editTarget", () => {
    act(() => useWizardStore.getState().openWizard(makeDeposit()));
    expect(useWizardStore.getState().wizardOpen).toBe(true);

    act(() => useWizardStore.getState().closeWizard());

    expect(useWizardStore.getState().wizardOpen).toBe(false);
    expect(useWizardStore.getState().editTarget).toBeNull();
  });

  it("closeWizard() clears rolloverConfig", () => {
    useWizardStore.setState({ wizardOpen: true, rolloverConfig: { sourceId: "x", deposit: makeDeposit(), proceedsPrincipal: 100, startDate: "2026-01-01" } });
    act(() => useWizardStore.getState().closeWizard());

    expect(useWizardStore.getState().rolloverConfig).toBeNull();
  });
});

// ─── Rollover state ───────────────────────────────────────────────────────────

describe("wizardStore — rollover state", () => {
  it("openRollover() sets wizardOpen=true with rolloverConfig and clears editTarget", () => {
    const deposit = makeDeposit();
    const config = { sourceId: deposit.id, deposit, proceedsPrincipal: 105_000, startDate: "2027-01-01" };

    act(() => useWizardStore.getState().openRollover(config));

    expect(useWizardStore.getState().wizardOpen).toBe(true);
    expect(useWizardStore.getState().rolloverConfig?.sourceId).toBe(deposit.id);
    expect(useWizardStore.getState().rolloverConfig?.proceedsPrincipal).toBe(105_000);
    expect(useWizardStore.getState().editTarget).toBeNull();
  });
});

// ─── highlightedId lifecycle ──────────────────────────────────────────────────

describe("wizardStore — highlightedId", () => {
  it("highlightedId is null by default", () => {
    expect(useWizardStore.getState().highlightedId).toBeNull();
  });

  it("highlight(id) sets highlightedId immediately", () => {
    act(() => useWizardStore.getState().highlight("dep-1"));

    expect(useWizardStore.getState().highlightedId).toBe("dep-1");
  });

  it("highlight clears highlightedId to null after 2500ms", () => {
    vi.useFakeTimers();

    act(() => useWizardStore.getState().highlight("dep-1"));
    expect(useWizardStore.getState().highlightedId).toBe("dep-1");

    act(() => vi.advanceTimersByTime(2500));
    expect(useWizardStore.getState().highlightedId).toBeNull();
  });

  it("calling highlight() again resets the timer", () => {
    vi.useFakeTimers();

    act(() => useWizardStore.getState().highlight("dep-1"));
    act(() => vi.advanceTimersByTime(1000));

    // Second highlight before timer fires — should reset the 2.5s window.
    act(() => useWizardStore.getState().highlight("dep-2"));
    act(() => vi.advanceTimersByTime(1500));

    // dep-2 was set 1500ms ago, timer hasn't expired yet.
    expect(useWizardStore.getState().highlightedId).toBe("dep-2");

    act(() => vi.advanceTimersByTime(1000));
    expect(useWizardStore.getState().highlightedId).toBeNull();
  });
});

// ─── Export AI state ──────────────────────────────────────────────────────────

describe("wizardStore — export ai state", () => {
  it("exportAiOpen is false by default", () => {
    expect(useWizardStore.getState().exportAiOpen).toBe(false);
  });

  it("openExportAi() sets exportAiOpen=true", () => {
    act(() => useWizardStore.getState().openExportAi());

    expect(useWizardStore.getState().exportAiOpen).toBe(true);
  });

  it("closeExportAi() sets exportAiOpen=false", () => {
    act(() => useWizardStore.getState().openExportAi());
    expect(useWizardStore.getState().exportAiOpen).toBe(true);

    act(() => useWizardStore.getState().closeExportAi());
    expect(useWizardStore.getState().exportAiOpen).toBe(false);
  });
});
