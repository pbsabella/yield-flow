"use client";

import { useCallback, useMemo, useState } from "react";
import type { InterestTier, PayoutFrequency, TimeDeposit } from "@/types";
import type { InterestMode, YieldInput } from "@/lib/domain/yield-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType = "td-maturity" | "td-monthly" | "savings";

export type WizardFormState = {
  bankName: string;                    // free text; stored as bankId on TimeDeposit
  productType: ProductType | "";
  name: string;
  principal: string;
  startDate: string;
  flatRate: string;
  taxRate: string;                     // "20" default
  interestMode: InterestMode;
  tiers: InterestTier[];
  termMonths: number | null;
  payoutFrequency: PayoutFrequency;
  compounding: "daily" | "monthly";
  dayCountConvention: 360 | 365;       // 365 default
  isOpenEnded: boolean;
};

export type FieldErrors = Partial<Record<keyof WizardFormState, string>>;
export type FieldWarnings = Partial<Record<keyof WizardFormState, string>>;

const EMPTY_STATE: WizardFormState = {
  bankName: "",
  productType: "",
  name: "",
  principal: "",
  startDate: new Date().toISOString().split("T")[0],
  flatRate: "",
  taxRate: "20",
  interestMode: "simple",
  tiers: [],
  termMonths: null,
  payoutFrequency: "maturity",
  compounding: "monthly",
  dayCountConvention: 365,
  isOpenEnded: false,
};

// ─── Deposit → form-state ─────────────────────────────────────────────────────

export function depositToFormState(deposit: TimeDeposit): WizardFormState {
  let productType: ProductType;
  if (deposit.isOpenEnded) {
    productType = "savings";
  } else if (deposit.payoutFrequency === "monthly") {
    productType = "td-monthly";
  } else {
    productType = "td-maturity";
  }

  const flatRate =
    deposit.interestMode === "simple"
      ? String(+(deposit.flatRate * 100).toFixed(4).replace(/\.?0+$/, ""))
      : "";

  const taxRate = String(
    +((deposit.taxRateOverride ?? 0.2) * 100).toFixed(4).replace(/\.?0+$/, ""),
  );

  return {
    bankName: deposit.bankId,
    productType,
    name: deposit.name,
    principal: String(deposit.principal),
    startDate: deposit.startDate,
    flatRate,
    taxRate,
    interestMode: deposit.interestMode,
    tiers: deposit.tiers ?? [],
    termMonths: deposit.isOpenEnded ? null : deposit.termMonths,
    payoutFrequency: deposit.payoutFrequency,
    compounding: deposit.compounding ?? "monthly",
    dayCountConvention: deposit.dayCountConvention ?? 365,
    isOpenEnded: deposit.isOpenEnded ?? false,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

function computeErrors(
  state: WizardFormState,
  touched: Set<keyof WizardFormState>,
): { errors: FieldErrors; warnings: FieldWarnings } {
  const errors: FieldErrors = {};
  const warnings: FieldWarnings = {};

  if (touched.has("bankName")) {
    if (!state.bankName.trim()) {
      errors.bankName = "Bank name is required";
    }
  }

  if (touched.has("principal")) {
    const val = parseFloat(state.principal);
    if (state.principal === "" || isNaN(val) || val <= 0) {
      errors.principal = "Principal must be greater than 0";
    }
  }

  if (touched.has("flatRate") && state.interestMode === "simple") {
    const val = parseFloat(state.flatRate);
    if (state.flatRate === "" || isNaN(val) || val <= 0) {
      errors.flatRate = "Rate is required";
    } else if (val < 0.01 || val > 25) {
      warnings.flatRate = "Unusual rate — double-check this value";
    }
  }

  if (touched.has("taxRate")) {
    const val = parseFloat(state.taxRate);
    if (state.taxRate === "" || isNaN(val) || val < 0 || val > 100) {
      errors.taxRate = "Tax rate must be between 0 and 100";
    }
  }

  if (touched.has("termMonths") && !state.isOpenEnded && state.termMonths === null) {
    errors.termMonths = "Term is required for fixed-term investments";
  }

  return { errors, warnings };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWizardState() {
  const [formState, setFormState] = useState<WizardFormState>(EMPTY_STATE);
  const [initialState, setInitialState] = useState<WizardFormState>(EMPTY_STATE);
  const [touched, setTouched] = useState<Set<keyof WizardFormState>>(new Set());
  const [discardOpen, setDiscardOpen] = useState(false);

  const { errors, warnings } = useMemo(
    () => computeErrors(formState, touched),
    [formState, touched],
  );

  // Compare against the snapshot that was set when the dialog opened (EMPTY_STATE
  // for new deposits, or the loaded deposit state for edits). This ensures that
  // opening an edit dialog with a pre-loaded deposit starts as non-dirty.
  const isDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialState),
    [formState, initialState],
  );

  const setField = useCallback(
    <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => {
      setFormState((prev) => {
        const next = { ...prev, [key]: value };

        // productType change: set sensible payout + open-ended defaults
        if (key === "productType") {
          if (value === "td-maturity") {
            next.payoutFrequency = "maturity";
            next.isOpenEnded = false;
          } else if (value === "td-monthly") {
            next.payoutFrequency = "monthly";
            next.isOpenEnded = false;
          } else if (value === "savings") {
            next.isOpenEnded = true;
            next.termMonths = null;
          }
        }

        // Tiered switch: seed first tier from current flat rate
        if (key === "interestMode") {
          if (value === "tiered" && prev.interestMode === "simple") {
            const rate = parseFloat(prev.flatRate) / 100;
            next.tiers = isNaN(rate) ? [] : [{ upTo: null, rate }];
          }
          if (value === "simple" && prev.interestMode === "tiered") {
            if (prev.tiers.length > 0) {
              next.flatRate = String((prev.tiers[0].rate * 100).toFixed(4).replace(/\.?0+$/, ""));
            }
          }
        }

        return next;
      });
    },
    [],
  );

  const touchField = useCallback((key: keyof WizardFormState) => {
    setTouched((prev) => new Set([...prev, key]));
  }, []);

  const canSubmit = useMemo(() => {
    if (!formState.bankName.trim()) return false;
    if (!formState.productType) return false;

    const principal = parseFloat(formState.principal);
    if (isNaN(principal) || principal <= 0) return false;

    if (formState.interestMode === "simple") {
      const flatRate = parseFloat(formState.flatRate);
      if (isNaN(flatRate) || flatRate <= 0) return false;
    } else {
      if (formState.tiers.length === 0) return false;
    }

    const taxRate = parseFloat(formState.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) return false;

    if (!formState.isOpenEnded && formState.termMonths === null) return false;

    return Object.keys(errors).length === 0;
  }, [formState, errors]);

  const reset = useCallback(() => {
    setFormState(EMPTY_STATE);
    setInitialState(EMPTY_STATE);
    setTouched(new Set());
    setDiscardOpen(false);
  }, []);

  const loadDeposit = useCallback((deposit: TimeDeposit) => {
    const state = depositToFormState(deposit);
    setFormState(state);
    setInitialState(state);
    setTouched(new Set());
    setDiscardOpen(false);
  }, []);

  // Derive YieldInput for the live calc preview — null if not enough valid data
  const deriveYieldInput = useCallback((): YieldInput | null => {
    const principal = parseFloat(formState.principal);
    if (isNaN(principal) || principal <= 0) return null;

    const startDate = formState.startDate;
    if (!startDate) return null;

    const taxRate = parseFloat(formState.taxRate) / 100;
    if (isNaN(taxRate)) return null;

    const interestTreatment: "reinvest" | "payout" =
      formState.payoutFrequency === "monthly" ? "payout" : "reinvest";

    const termMonths = formState.isOpenEnded ? 12 : (formState.termMonths ?? 0);
    if (termMonths === 0) return null;

    if (formState.interestMode === "simple") {
      const flatRate = parseFloat(formState.flatRate) / 100;
      if (isNaN(flatRate) || flatRate <= 0) return null;
      return {
        principal,
        startDate,
        termMonths,
        flatRate,
        tiers: [],
        interestMode: "simple",
        interestTreatment,
        compounding: formState.compounding,
        taxRate,
        dayCountConvention: formState.dayCountConvention,
      };
    }

    // Tiered mode
    if (formState.tiers.length === 0) return null;
    const flatRate = formState.tiers[0].rate;
    return {
      principal,
      startDate,
      termMonths,
      flatRate,
      tiers: formState.tiers,
      interestMode: "tiered",
      interestTreatment,
      compounding: formState.compounding,
      taxRate,
      dayCountConvention: formState.dayCountConvention,
    };
  }, [formState]);

  // Build the final TimeDeposit for persistence
  const buildDeposit = useCallback(
    (id: string): TimeDeposit => {
      const principal = parseFloat(formState.principal);
      const flatRate = parseFloat(formState.flatRate) / 100;
      const taxRateOverride = parseFloat(formState.taxRate) / 100;
      const interestTreatment: "reinvest" | "payout" =
        formState.payoutFrequency === "monthly" ? "payout" : "reinvest";

      const tiers =
        formState.interestMode === "tiered"
          ? formState.tiers
          : [{ upTo: null as null, rate: flatRate }];

      return {
        id,
        bankId: formState.bankName.trim(),
        name: formState.name.trim() || `${formState.bankName.trim()} deposit`,
        principal,
        startDate: formState.startDate,
        termMonths: formState.isOpenEnded ? 12 : (formState.termMonths ?? 12),
        interestMode: formState.interestMode,
        interestTreatment,
        compounding: formState.compounding,
        taxRateOverride,
        flatRate,
        tiers,
        payoutFrequency: formState.payoutFrequency,
        dayCountConvention: formState.dayCountConvention,
        isOpenEnded: formState.isOpenEnded || undefined,
        status: "active",
      };
    },
    [formState],
  );

  return {
    formState,
    errors,
    warnings,
    isDirty,
    discardOpen,
    setDiscardOpen,
    setField,
    touchField,
    canSubmit,
    reset,
    loadDeposit,
    deriveYieldInput,
    buildDeposit,
  } as const;
}
