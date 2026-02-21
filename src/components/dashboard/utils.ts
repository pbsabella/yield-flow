import type { DepositFormErrors, DepositFormState } from "@/components/dashboard/types";

export function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function decimalToPercentString(value: string) {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed * 100);
}

export function percentToDecimalString(value: string) {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed / 100);
}

export function validateDeposit(form: DepositFormState) {
  const errors: DepositFormErrors = {};
  if (!form.bankName.trim()) errors.bankName = "Bank is required.";
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.startDate) errors.startDate = "Start date is required.";
  if (toNumber(form.principal) <= 0) errors.principal = "Principal must be > 0.";
  if (toNumber(form.termMonths) <= 0) errors.termMonths = "Term must be > 0.";

  if (form.interestMode === "simple") {
    if (toNumber(form.flatRate) <= 0) errors.flatRate = "Rate must be > 0.";
  } else {
    if (toNumber(form.tier1Rate) <= 0) errors.tier1Rate = "Tier 1 rate must be > 0.";
    if (toNumber(form.tier2Rate) <= 0) errors.tier2Rate = "Tier 2 rate must be > 0.";
  }

  if (toNumber(form.taxRate) < 0 || toNumber(form.taxRate) > 1) {
    errors.taxRate = "Tax rate must be between 0 and 1.";
  }

  return errors;
}
