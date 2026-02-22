import { addTermMonths, differenceInCalendarDays, toISODate } from "@/lib/domain/date";
import type {
  DepositFormErrors,
  DepositFormState,
  DepositFormWarnings,
  ProductType,
  TierInput,
} from "@/components/dashboard/types";
import type { InterestTier } from "@/lib/types";

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeNumericInput(value: string, decimals = 6) {
  if (!value) return "";
  if (value.endsWith(".")) return value;
  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return value;
  return String(roundTo(parsed, decimals));
}

export function decimalToPercentString(value: string) {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(roundTo(parsed * 100, 6));
}

export function percentToDecimalString(value: string) {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(roundTo(parsed / 100, 8));
}

export function formatCurrencyInput(value: string) {
  const parsed = toNumber(value.replace(/,/g, ""));
  if (parsed <= 0) return value;
  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(parsed);
}

export function unformatCurrencyInput(value: string) {
  return value.replace(/,/g, "");
}

export function productTypeLabel(productType: ProductType | "") {
  switch (productType) {
    case "td-maturity":
      return "Time Deposit - Maturity Payout";
    case "td-monthly":
      return "Time Deposit - Monthly Payout";
    case "savings":
      return "Savings / Open-ended";
    default:
      return "";
  }
}

export function labelToMonthYear(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function convertTermMonthsToEndDate(startDate: string, termMonths: string) {
  if (!startDate || !termMonths) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  const maturity = addTermMonths(start, Math.max(0.1, toNumber(termMonths)));
  return toISODate(maturity);
}

export function convertEndDateToTermMonths(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const days = Math.max(1, differenceInCalendarDays(end, start));
  return String(roundTo(days / 30, 2));
}

export function ensureFinalUnlimitedTier(tiers: TierInput[]) {
  if (tiers.length === 0) {
    return [{ id: crypto.randomUUID(), upTo: "", rate: "" }];
  }

  const cloned = tiers.map((tier) => ({ ...tier }));
  const last = cloned[cloned.length - 1];
  last.upTo = "";
  return cloned;
}

export function parseTierInputs(tiers: TierInput[]): InterestTier[] {
  const normalized = ensureFinalUnlimitedTier(tiers);
  return normalized
    .map((tier, index) => ({
      upTo: index === normalized.length - 1 ? null : toNumber(tier.upTo) || null,
      rate: toNumber(tier.rate),
    }))
    .filter((tier) => tier.rate > 0);
}

export function validateDeposit(form: DepositFormState) {
  const errors: DepositFormErrors = {};

  if (!form.bankId) errors.bankId = "Bank is required.";
  if (!form.productType) errors.productType = "Product type is required.";
  if (!form.name.trim()) errors.name = "Investment name is required.";
  if (toNumber(unformatCurrencyInput(form.principal)) <= 0) {
    errors.principal = "Principal must be greater than 0.";
  }
  if (!form.startDate) errors.startDate = "Start date is required.";
  if (!form.tieredEnabled && toNumber(form.rate) <= 0) errors.rate = "Rate is required.";

  if (!form.isOpenEnded) {
    if (form.termInputMode === "months" && toNumber(form.termMonths) <= 0) {
      errors.termMonths = "Term must be greater than 0 months.";
    }
    if (form.termInputMode === "end-date" && !form.endDate) {
      errors.endDate = "End date is required.";
    }
  }

  if (toNumber(form.taxRate) < 0 || toNumber(form.taxRate) > 1) {
    errors.taxRate = "Tax rate must be between 0 and 100%.";
  }

  if (form.tieredEnabled) {
    const normalized = ensureFinalUnlimitedTier(form.tiers);
    normalized.forEach((tier, index) => {
      if (toNumber(tier.rate) <= 0) {
        errors[`tier-${tier.id}-rate`] = `Tier ${index + 1} rate must be greater than 0.`;
      }
      if (index < normalized.length - 1 && toNumber(tier.upTo) <= 0) {
        errors[`tier-${tier.id}-upTo`] =
          `Tier ${index + 1} upper limit must be greater than 0.`;
      }
    });
  }

  if ((form.status === "matured" || form.status === "settled") && form.startDate) {
    const start = new Date(form.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start > today) {
      errors.startDate = "Start date cannot be in the future for matured investments.";
    }
  }

  return errors;
}

export function buildWarnings(form: DepositFormState, bankPrincipalTotal: number) {
  const warnings: DepositFormWarnings = {};
  const ratePercent = toNumber(form.rate) * 100;
  if (
    !form.tieredEnabled &&
    ratePercent > 0 &&
    (ratePercent < 0.01 || ratePercent > 25)
  ) {
    warnings.rate = "This rate seems unusual — double check with your bank.";
  }

  if (form.startDate) {
    const start = new Date(form.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start > today) {
      warnings.startDate =
        "This investment hasn't started yet — it will appear as upcoming.";
    }
  }

  if (bankPrincipalTotal >= 900000) {
    warnings.pdic = `Your total balance with ${form.bankName || "this bank"} will be near the ₱1,000,000 PDIC insurance limit. Consider spreading across banks.`;
  }

  if (form.tieredEnabled && form.tiers.length > 1) {
    const principal = toNumber(unformatCurrencyInput(form.principal));
    const thresholds = form.tiers
      .slice(0, -1)
      .map((tier) => toNumber(tier.upTo))
      .filter((value) => value > 0)
      .sort((a, b) => a - b);

    if (thresholds.some((threshold) => principal > threshold)) {
      warnings.tiers = `Your principal of ${new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(
        principal,
      )} spans multiple rate tiers. Rates have been split accordingly.`;
    }
  }

  return warnings;
}
