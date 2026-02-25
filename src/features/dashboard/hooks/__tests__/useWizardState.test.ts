import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWizardState, depositToFormState } from "../useWizardState";
import type { TimeDeposit } from "@/types";

// ─── Initial state ─────────────────────────────────────────────────────────────

describe("useWizardState — initial state", () => {
  it("starts with empty fields and correct defaults", () => {
    const { result } = renderHook(() => useWizardState());
    const s = result.current.formState;
    expect(s.bankName).toBe("");
    expect(s.productType).toBe("");
    expect(s.name).toBe("");
    expect(s.principal).toBe("");
    expect(s.flatRate).toBe("");
    expect(s.taxRate).toBe("20");
    expect(s.interestMode).toBe("simple");
    expect(s.tiers).toEqual([]);
    expect(s.termMonths).toBeNull();
    expect(s.payoutFrequency).toBe("maturity");
    expect(s.compounding).toBe("monthly");
    expect(s.dayCountConvention).toBe(365);
    expect(s.isOpenEnded).toBe(false);
  });

  it("is not dirty initially", () => {
    const { result } = renderHook(() => useWizardState());
    expect(result.current.isDirty).toBe(false);
  });

  it("canSubmit is false initially", () => {
    const { result } = renderHook(() => useWizardState());
    expect(result.current.canSubmit).toBe(false);
  });
});

// ─── productType side effects ──────────────────────────────────────────────────

describe("useWizardState — productType side effects", () => {
  it("td-maturity sets payoutFrequency=maturity and isOpenEnded=false", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("productType", "td-maturity");
    });

    expect(result.current.formState.payoutFrequency).toBe("maturity");
    expect(result.current.formState.isOpenEnded).toBe(false);
  });

  it("td-monthly sets payoutFrequency=monthly and isOpenEnded=false", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("productType", "td-monthly");
    });

    expect(result.current.formState.payoutFrequency).toBe("monthly");
    expect(result.current.formState.isOpenEnded).toBe(false);
  });

  it("savings sets isOpenEnded=true and termMonths=null", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("termMonths", 6);
      result.current.setField("productType", "savings");
    });

    expect(result.current.formState.isOpenEnded).toBe(true);
    expect(result.current.formState.termMonths).toBeNull();
  });
});

// ─── Tiered rate toggle ────────────────────────────────────────────────────────

describe("useWizardState — tiered rate toggle", () => {
  it("switching to tiered seeds first tier from current flat rate", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("flatRate", "6.5");
    });

    act(() => {
      result.current.setField("interestMode", "tiered");
    });

    const { tiers, interestMode } = result.current.formState;
    expect(interestMode).toBe("tiered");
    expect(tiers).toHaveLength(1);
    expect(tiers[0].upTo).toBeNull();
    expect(tiers[0].rate).toBeCloseTo(0.065);
  });

  it("switching back to simple restores flatRate from first tier", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("flatRate", "8");
      result.current.setField("interestMode", "tiered");
      result.current.setField("tiers", [
        { upTo: 500000, rate: 0.045 },
        { upTo: null, rate: 0.055 },
      ]);
    });

    act(() => {
      result.current.setField("interestMode", "simple");
    });

    expect(result.current.formState.interestMode).toBe("simple");
    // First tier rate 0.045 → "4.5"
    expect(result.current.formState.flatRate).toBe("4.5");
  });

  it("switching to tiered with no flatRate produces empty tiers", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("interestMode", "tiered");
    });

    expect(result.current.formState.tiers).toHaveLength(0);
  });
});

// ─── Validation ────────────────────────────────────────────────────────────────

describe("useWizardState — validation", () => {
  it("sets error for empty bankName after touchField", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.touchField("bankName");
    });

    expect(result.current.errors.bankName).toBeDefined();
  });

  it("clears bankName error once a name is provided", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.touchField("bankName");
    });

    expect(result.current.errors.bankName).toBeDefined();

    act(() => {
      result.current.setField("bankName", "My Bank");
    });

    expect(result.current.errors.bankName).toBeUndefined();
  });

  it("sets error for principal ≤ 0 after touchField", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("principal", "0");
      result.current.touchField("principal");
    });

    expect(result.current.errors.principal).toBeDefined();
  });

  it("sets error for empty principal after touchField", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.touchField("principal");
    });

    expect(result.current.errors.principal).toBeDefined();
  });

  it("sets warning for flatRate outside 0.01–25 range", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("flatRate", "99");
      result.current.touchField("flatRate");
    });

    expect(result.current.warnings.flatRate).toBeDefined();
  });

  it("sets error for taxRate outside 0–100", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("taxRate", "150");
      result.current.touchField("taxRate");
    });

    expect(result.current.errors.taxRate).toBeDefined();
  });

  it("clears principal error once principal is valid", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.touchField("principal");
    });

    expect(result.current.errors.principal).toBeDefined();

    act(() => {
      result.current.setField("principal", "100000");
    });

    expect(result.current.errors.principal).toBeUndefined();
  });

  it("sets error for termMonths when not open-ended and term is null", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("isOpenEnded", false);
      result.current.touchField("termMonths");
    });

    expect(result.current.errors.termMonths).toBeDefined();
  });
});

// ─── canSubmit ─────────────────────────────────────────────────────────────────

describe("useWizardState — canSubmit", () => {
  it("canSubmit is false without bankName", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("canSubmit is false without productType", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("canSubmit is false without termMonths for non-open-ended", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      // termMonths left null, isOpenEnded=false
    });

    expect(result.current.canSubmit).toBe(false);
  });

  it("canSubmit is true when all required fields are valid (simple mode)", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("canSubmit is true for savings (open-ended, no term required)", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "savings"); // sets isOpenEnded=true
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "4");
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("canSubmit is true for tiered mode with at least one tier", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("interestMode", "tiered");
      result.current.setField("tiers", [{ upTo: null, rate: 0.06 }]);
      result.current.setField("termMonths", 6);
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("canSubmit is false for tiered mode with no tiers", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("interestMode", "tiered");
      // tiers left empty
      result.current.setField("termMonths", 6);
    });

    expect(result.current.canSubmit).toBe(false);
  });
});

// ─── deriveYieldInput ──────────────────────────────────────────────────────────

describe("useWizardState — deriveYieldInput", () => {
  it("returns null when principal is empty", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
      // principal left empty
    });

    expect(result.current.deriveYieldInput()).toBeNull();
  });

  it("returns null when termMonths is null and not open-ended", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", null);
    });

    expect(result.current.deriveYieldInput()).toBeNull();
  });

  it("returns valid YieldInput when required fields are complete", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "8");
      result.current.setField("termMonths", 6);
      result.current.setField("startDate", "2026-02-25");
    });

    const input = result.current.deriveYieldInput();
    expect(input).not.toBeNull();
    expect(input?.principal).toBe(100000);
    expect(input?.flatRate).toBeCloseTo(0.08);
    expect(input?.taxRate).toBeCloseTo(0.2);
    expect(input?.termMonths).toBe(6);
    expect(input?.startDate).toBe("2026-02-25");
    expect(input?.interestMode).toBe("simple");
    expect(input?.dayCountConvention).toBe(365);
  });

  it("uses 12 months as term for open-ended deposits", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "savings"); // sets isOpenEnded=true
      result.current.setField("principal", "500000");
      result.current.setField("flatRate", "4");
      result.current.setField("startDate", "2026-02-25");
    });

    const input = result.current.deriveYieldInput();
    expect(input?.termMonths).toBe(12);
  });

  it("respects dayCountConvention=360", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
      result.current.setField("dayCountConvention", 360);
    });

    const input = result.current.deriveYieldInput();
    expect(input?.dayCountConvention).toBe(360);
  });

  it("sets interestTreatment=payout for td-monthly productType", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-monthly"); // sets payoutFrequency=monthly
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 12);
    });

    const input = result.current.deriveYieldInput();
    expect(input?.interestTreatment).toBe("payout");
  });
});

// ─── buildDeposit ──────────────────────────────────────────────────────────────

describe("useWizardState — buildDeposit", () => {
  it("builds a complete TimeDeposit with correct values", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "Test Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("name", "My 6M TD");
      result.current.setField("principal", "250000");
      result.current.setField("flatRate", "8");
      result.current.setField("termMonths", 6);
      result.current.setField("startDate", "2026-02-25");
    });

    const deposit = result.current.buildDeposit("test-uuid");

    expect(deposit.id).toBe("test-uuid");
    expect(deposit.bankId).toBe("Test Bank");
    expect(deposit.name).toBe("My 6M TD");
    expect(deposit.principal).toBe(250000);
    expect(deposit.startDate).toBe("2026-02-25");
    expect(deposit.termMonths).toBe(6);
    expect(deposit.flatRate).toBeCloseTo(0.08);
    expect(deposit.taxRateOverride).toBeCloseTo(0.2);
    expect(deposit.status).toBe("active");
    expect(deposit.interestMode).toBe("simple");
    expect(deposit.interestTreatment).toBe("reinvest");
    expect(deposit.dayCountConvention).toBe(365);
  });

  it("uses bankName.trim() as bankId", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "  Spaced Bank  ");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
    });

    const deposit = result.current.buildDeposit("id-1");
    expect(deposit.bankId).toBe("Spaced Bank");
  });

  it("falls back to bankName as deposit name when name is empty", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "CIMB");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
      // name left empty
    });

    const deposit = result.current.buildDeposit("id-2");
    expect(deposit.name).toBe("CIMB deposit");
  });

  it("sets interestTreatment=payout for monthly payout frequency", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-monthly"); // → payoutFrequency=monthly
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 12);
      result.current.setField("startDate", "2026-02-25");
    });

    const deposit = result.current.buildDeposit("id-3");
    expect(deposit.interestTreatment).toBe("payout");
    expect(deposit.payoutFrequency).toBe("monthly");
  });

  it("stores sentinel single tier for simple mode deposits", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "8");
      result.current.setField("termMonths", 6);
    });

    const deposit = result.current.buildDeposit("id-4");
    expect(deposit.tiers).toHaveLength(1);
    expect(deposit.tiers[0].upTo).toBeNull();
    expect(deposit.tiers[0].rate).toBeCloseTo(0.08);
  });

  it("marks open-ended deposits with isOpenEnded=true and termMonths=12", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "savings"); // sets isOpenEnded=true
      result.current.setField("principal", "1000000");
      result.current.setField("flatRate", "4");
      result.current.setField("startDate", "2026-02-25");
    });

    const deposit = result.current.buildDeposit("open-id");
    expect(deposit.isOpenEnded).toBe(true);
    expect(deposit.termMonths).toBe(12);
  });

  it("stores dayCountConvention=360 when set", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "6");
      result.current.setField("termMonths", 6);
      result.current.setField("dayCountConvention", 360);
    });

    const deposit = result.current.buildDeposit("id-5");
    expect(deposit.dayCountConvention).toBe(360);
  });
});

// ─── isDirty ───────────────────────────────────────────────────────────────────

describe("useWizardState — isDirty", () => {
  it("becomes dirty after setting bankName", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
    });

    expect(result.current.isDirty).toBe(true);
  });

  it("becomes dirty after setting productType", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("productType", "td-maturity");
    });

    expect(result.current.isDirty).toBe(true);
  });

  it("becomes dirty after filling in principal", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("principal", "50000");
    });

    expect(result.current.isDirty).toBe(true);
  });

  it("resets to not dirty after reset()", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("principal", "100000");
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isDirty).toBe(false);
  });

  it("reset restores all defaults", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.setField("bankName", "My Bank");
      result.current.setField("productType", "td-maturity");
      result.current.setField("principal", "100000");
      result.current.setField("flatRate", "8");
      result.current.setField("termMonths", 6);
      result.current.setField("dayCountConvention", 360);
    });

    act(() => {
      result.current.reset();
    });

    const s = result.current.formState;
    expect(s.bankName).toBe("");
    expect(s.productType).toBe("");
    expect(s.principal).toBe("");
    expect(s.flatRate).toBe("");
    expect(s.termMonths).toBeNull();
    expect(s.dayCountConvention).toBe(365);
    expect(s.taxRate).toBe("20");
    expect(s.isOpenEnded).toBe(false);
  });
});

// ─── loadDeposit ───────────────────────────────────────────────────────────────

const BASE_DEPOSIT: TimeDeposit = {
  id: "dep-1",
  bankId: "BDO",
  name: "BDO 6-month TD",
  principal: 500_000,
  startDate: "2025-01-01",
  flatRate: 0.06,
  interestMode: "simple",
  tiers: [],
  termMonths: 6,
  payoutFrequency: "maturity",
  compounding: "monthly",
  dayCountConvention: 365,
  taxRateOverride: 0.2,
  isOpenEnded: false,
  status: "active",
};

describe("depositToFormState", () => {
  it("maps a td-maturity deposit correctly", () => {
    const s = depositToFormState(BASE_DEPOSIT);
    expect(s.bankName).toBe("BDO");
    expect(s.productType).toBe("td-maturity");
    expect(s.principal).toBe("500000");
    expect(s.flatRate).toBe("6");
    expect(s.taxRate).toBe("20");
    expect(s.termMonths).toBe(6);
    expect(s.payoutFrequency).toBe("maturity");
    expect(s.compounding).toBe("monthly");
    expect(s.dayCountConvention).toBe(365);
    expect(s.isOpenEnded).toBe(false);
  });

  it("maps a td-monthly deposit (payoutFrequency=monthly → productType=td-monthly)", () => {
    const s = depositToFormState({ ...BASE_DEPOSIT, payoutFrequency: "monthly" });
    expect(s.productType).toBe("td-monthly");
    expect(s.payoutFrequency).toBe("monthly");
  });

  it("maps a savings deposit (isOpenEnded=true → productType=savings)", () => {
    const s = depositToFormState({ ...BASE_DEPOSIT, isOpenEnded: true });
    expect(s.productType).toBe("savings");
    expect(s.isOpenEnded).toBe(true);
    expect(s.termMonths).toBeNull();
  });

  it("converts flatRate from decimal to percentage string", () => {
    const s = depositToFormState({ ...BASE_DEPOSIT, flatRate: 0.0575 });
    expect(s.flatRate).toBe("5.75");
  });

  it("converts taxRateOverride to percentage string", () => {
    const s = depositToFormState({ ...BASE_DEPOSIT, taxRateOverride: 0.25 });
    expect(s.taxRate).toBe("25");
  });

  it("falls back to 20% tax rate when taxRateOverride is undefined", () => {
    const { taxRateOverride: _, ...noOverride } = BASE_DEPOSIT;
    const s = depositToFormState(noOverride as TimeDeposit);
    expect(s.taxRate).toBe("20");
  });
});

describe("useWizardState — loadDeposit", () => {
  it("populates form state from a deposit", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.loadDeposit(BASE_DEPOSIT);
    });

    const s = result.current.formState;
    expect(s.bankName).toBe("BDO");
    expect(s.productType).toBe("td-maturity");
    expect(s.principal).toBe("500000");
    expect(s.flatRate).toBe("6");
    expect(s.termMonths).toBe(6);
  });

  it("isDirty is false immediately after loadDeposit", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.loadDeposit(BASE_DEPOSIT);
    });

    expect(result.current.isDirty).toBe(false);
  });

  it("isDirty becomes true after modifying a field post-load", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.loadDeposit(BASE_DEPOSIT);
    });

    act(() => {
      result.current.setField("principal", "999999");
    });

    expect(result.current.isDirty).toBe(true);
  });

  it("reset after loadDeposit returns to empty state, not loaded state", () => {
    const { result } = renderHook(() => useWizardState());

    act(() => {
      result.current.loadDeposit(BASE_DEPOSIT);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.formState.bankName).toBe("");
    expect(result.current.formState.principal).toBe("");
    expect(result.current.isDirty).toBe(false);
  });
});
