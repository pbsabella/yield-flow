import { describe, expect, it, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PortfolioProvider, usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { useWizardStore } from "@/store/wizardStore";
import type { TimeDeposit } from "@/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DEPOSITS_KEY = "yf:deposits";

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

function wrapper({ children }: { children: React.ReactNode }) {
  return <PortfolioProvider>{children}</PortfolioProvider>;
}

beforeEach(() => {
  localStorage.clear();
  // Reset wizard store so context tests don't bleed into each other.
  useWizardStore.setState({
    wizardOpen: false,
    editTarget: null,
    rolloverConfig: null,
    highlightedId: null,
    exportAiOpen: false,
  });
});

// ─── Guard ───────────────────────────────────────────────────────────────────

describe("usePortfolioContext — guard", () => {
  it("throws when used outside PortfolioProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    expect(() => renderHook(() => usePortfolioContext())).toThrow(
      /usePortfolioContext must be used within PortfolioProvider/,
    );
    consoleSpy.mockRestore();
  });
});

// ─── Status machine ───────────────────────────────────────────────────────────

describe("PortfolioContext — status machine", () => {
  // Note: the "booting" state is real in production (before useEffect hydration),
  // but renderHook flushes effects synchronously inside act(), so it is not
  // observable as a stable state in unit tests. We test the post-hydration states.

  it("transitions to 'empty' after hydration with no deposits", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("empty"));
  });

  it("transitions to 'ready' after hydration when deposits exist in storage", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit()]));
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("hasSidebar is false when status is 'empty'", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(result.current.hasSidebar).toBe(false);
  });

  it("hasSidebar is true when status is 'ready'", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit()]));
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.hasSidebar).toBe(true));
  });
});

// ─── Demo mode ───────────────────────────────────────────────────────────────

describe("PortfolioContext — demo mode", () => {
  it("enterDemo sets isDemoMode=true and loads demo deposits", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => result.current.enterDemo());

    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(true);
      expect(result.current.deposits.length).toBeGreaterThan(0);
    });
  });

  it("hasSidebar is true in demo mode", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => result.current.enterDemo());
    await waitFor(() => expect(result.current.hasSidebar).toBe(true));
  });

  it("exitDemo clears isDemoMode and deposits", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => result.current.enterDemo());
    await waitFor(() => expect(result.current.isDemoMode).toBe(true));

    act(() => result.current.exitDemo());
    await waitFor(() => {
      expect(result.current.isDemoMode).toBe(false);
      expect(result.current.deposits).toEqual([]);
    });
  });
});

// ─── Wizard state ─────────────────────────────────────────────────────────────
// Full wizard state tests live in src/store/__tests__/wizardStore.test.ts.
// We only verify the one integration point: handleEdit() opens the store's wizard.

describe("PortfolioContext — wizard integration", () => {
  it("handleEdit(deposit) opens the wizard with the deposit as editTarget", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const deposit = makeDeposit({ id: "edit-me" });
    act(() => result.current.handleEdit(deposit));

    expect(useWizardStore.getState().wizardOpen).toBe(true);
    expect(useWizardStore.getState().editTarget?.id).toBe("edit-me");
  });
});

// ─── CRUD — demo mode ─────────────────────────────────────────────────────────

describe("PortfolioContext — CRUD in demo mode", () => {
  async function setupDemo() {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    act(() => result.current.enterDemo());
    await waitFor(() => expect(result.current.deposits.length).toBeGreaterThan(0));
    return result;
  }

  it("handleSave adds a new deposit", async () => {
    const result = await setupDemo();
    const countBefore = result.current.deposits.length;
    const newDeposit = makeDeposit({ id: "brand-new" });

    act(() => result.current.handleSave(newDeposit));

    await waitFor(() => expect(result.current.deposits.length).toBe(countBefore + 1));
    expect(result.current.deposits.some((d) => d.id === "brand-new")).toBe(true);
  });

  it("handleSave updates an existing deposit when editTarget is set", async () => {
    const result = await setupDemo();
    const target = result.current.deposits[0];
    const countBefore = result.current.deposits.length;

    // openWizard now lives in the store — call it directly (synchronous, no waitFor needed).
    act(() => useWizardStore.getState().openWizard(target));

    act(() => result.current.handleSave({ ...target, name: "Renamed Deposit" }));

    await waitFor(() => {
      const updated = result.current.deposits.find((d) => d.id === target.id);
      expect(updated?.name).toBe("Renamed Deposit");
    });
    // count must not change
    expect(result.current.deposits.length).toBe(countBefore);
  });

  it("handleSettle marks a deposit as settled", async () => {
    const result = await setupDemo();
    const target = result.current.deposits[0];

    act(() => result.current.handleSettle(target.id));

    await waitFor(() => {
      const settled = result.current.deposits.find((d) => d.id === target.id);
      expect(settled?.status).toBe("settled");
    });
  });

  it("handleDelete removes a deposit", async () => {
    const result = await setupDemo();
    const target = result.current.deposits[0];
    const countBefore = result.current.deposits.length;

    act(() => result.current.handleDelete(target.id));

    await waitFor(() => {
      expect(result.current.deposits.length).toBe(countBefore - 1);
      expect(result.current.deposits.some((d) => d.id === target.id)).toBe(false);
    });
  });
});

// ─── CRUD — persisted mode ────────────────────────────────────────────────────

describe("PortfolioContext — CRUD in persisted mode", () => {
  it("handleSave adds a new deposit and persists it", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit({ id: "existing" })]));

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(1));

    const newDeposit = makeDeposit({ id: "added" });
    act(() => result.current.handleSave(newDeposit));

    await waitFor(() => expect(result.current.deposits.length).toBe(2));
    expect(result.current.deposits.some((d) => d.id === "added")).toBe(true);
  });

  it("handleSettle updates status in persisted deposits", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit({ id: "to-settle" })]));

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(1));

    act(() => result.current.handleSettle("to-settle"));

    await waitFor(() => {
      const dep = result.current.deposits.find((d) => d.id === "to-settle");
      expect(dep?.status).toBe("settled");
    });
  });

  it("handleDelete removes a deposit from persisted list", async () => {
    localStorage.setItem(
      DEPOSITS_KEY,
      JSON.stringify([makeDeposit({ id: "keep" }), makeDeposit({ id: "remove" })]),
    );

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(2));

    act(() => result.current.handleDelete("remove"));

    await waitFor(() => expect(result.current.deposits.length).toBe(1));
    expect(result.current.deposits[0].id).toBe("keep");
  });
});

// ─── highlightedId lifecycle ──────────────────────────────────────────────────

describe("PortfolioContext — highlight integration", () => {
  it("handleSave sets highlightedId in the store", async () => {
    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => result.current.enterDemo());
    await waitFor(() => expect(result.current.deposits.length).toBeGreaterThan(0));

    const dep = result.current.deposits[0];
    act(() => result.current.handleSave(dep));

    expect(useWizardStore.getState().highlightedId).toBe(dep.id);
  });
});

// ─── importDeposits & clearDeposits ──────────────────────────────────────────

describe("PortfolioContext — importDeposits", () => {
  it("replaces existing deposits with the imported array", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit({ id: "old" })]));

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(1));

    const incoming = [makeDeposit({ id: "new-1" }), makeDeposit({ id: "new-2" })];
    act(() => result.current.importDeposits(incoming));

    await waitFor(() => expect(result.current.deposits.length).toBe(2));
    expect(result.current.deposits[0].id).toBe("new-1");
  });
});

describe("PortfolioContext — clearDeposits", () => {
  it("empties the deposits list", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit(), makeDeposit({ id: "dep-2" })]));

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(2));

    act(() => result.current.clearDeposits());

    // clearDeposits calls remove() + setDeposits([]). setDeposits([]) re-persists
    // "[]" via useLocalStorage's effect, so the key exists but holds an empty array.
    await waitFor(() => expect(result.current.deposits).toEqual([]));
    expect(result.current.status).toBe("empty");
  });
});

// ─── existingBankNames ────────────────────────────────────────────────────────

describe("PortfolioContext — existingBankNames", () => {
  it("returns a deduped array of bankIds from current deposits", async () => {
    localStorage.setItem(
      DEPOSITS_KEY,
      JSON.stringify([
        makeDeposit({ id: "a", bankId: "BankA" }),
        makeDeposit({ id: "b", bankId: "BankB" }),
        makeDeposit({ id: "c", bankId: "BankA" }), // duplicate
      ]),
    );

    const { result } = renderHook(() => usePortfolioContext(), { wrapper });
    await waitFor(() => expect(result.current.deposits.length).toBe(3));

    expect(result.current.existingBankNames).toHaveLength(2);
    expect(result.current.existingBankNames).toContain("BankA");
    expect(result.current.existingBankNames).toContain("BankB");
  });
});
