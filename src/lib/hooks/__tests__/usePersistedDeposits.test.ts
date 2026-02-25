import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import type { TimeDeposit } from "@/types";

const DEPOSITS_KEY = "yf:deposits";

const makeDeposit = (id: string): TimeDeposit => ({
  id,
  bankId: "Test Bank",
  name: `Deposit ${id}`,
  principal: 100000,
  startDate: "2025-06-01",
  termMonths: 6,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  flatRate: 0.065,
  tiers: [{ upTo: null, rate: 0.065 }],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  isOpenEnded: false,
  status: "active",
});

beforeEach(() => {
  localStorage.clear();
});

describe("usePersistedDeposits — initial state", () => {
  it("returns an empty array when localStorage is empty", async () => {
    const { result } = renderHook(() => usePersistedDeposits());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.deposits).toEqual([]);
  });

  it("hydrates from existing yf:deposits key", async () => {
    const stored = [makeDeposit("dep-1"), makeDeposit("dep-2")];
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => usePersistedDeposits());
    await waitFor(() => expect(result.current.deposits).toHaveLength(2));
    expect(result.current.deposits[0].id).toBe("dep-1");
  });
});

describe("usePersistedDeposits — mutations", () => {
  it("persists a new deposit when setDeposits is called", async () => {
    const { result } = renderHook(() => usePersistedDeposits());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const dep = makeDeposit("new-dep");
    act(() => {
      result.current.setDeposits([dep]);
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(DEPOSITS_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe("new-dep");
    });
  });

  it("removes a deposit when filtered out via setDeposits", async () => {
    const initial = [makeDeposit("a"), makeDeposit("b")];
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(initial));

    const { result } = renderHook(() => usePersistedDeposits());
    await waitFor(() => expect(result.current.deposits).toHaveLength(2));

    act(() => {
      result.current.setDeposits(result.current.deposits.filter((d) => d.id !== "a"));
    });

    await waitFor(() => expect(result.current.deposits).toHaveLength(1));
    expect(result.current.deposits[0].id).toBe("b");
  });

  it("clears all deposits when remove() is called", async () => {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify([makeDeposit("x")]));

    const { result } = renderHook(() => usePersistedDeposits());
    await waitFor(() => expect(result.current.deposits).toHaveLength(1));

    act(() => {
      result.current.remove();
    });

    expect(localStorage.getItem(DEPOSITS_KEY)).toBeNull();
  });
});
