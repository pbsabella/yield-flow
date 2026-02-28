import type { InterestMode } from "@/lib/domain/yield-engine";

export type PayoutFrequency = "monthly" | "maturity";

export type InterestTier = {
  upTo: number | null;
  rate: number;
};

export type TimeDeposit = {
  id: string;
  bankId: string;
  name: string;
  principal: number;
  startDate: string;
  /**
   * @deprecated Use termDays instead for day-based products. Will be removed after full migration.
   * TODO: remove termMonths once all stored deposits have been migrated to termDays.
   */
  termMonths: number;
  /** Term in calendar days. When set, takes precedence over termMonths for all calculations. */
  termDays?: number;
  interestMode: InterestMode;
  interestTreatment?: "reinvest" | "payout";
  compounding?: "daily" | "monthly";
  taxRateOverride?: number;
  flatRate: number;
  tiers: InterestTier[];
  payoutFrequency: PayoutFrequency;
  dayCountConvention?: 360 | 365;
  isOpenEnded?: boolean;
  status: "active" | "matured" | "settled";
};

export type Bank = {
  id: string;
  name: string;
  taxRate: number;
  notes?: string;
};

export type DepositSummary = {
  deposit: TimeDeposit;
  bank: Bank;
  maturityDate: string | null;
  grossInterest: number;
  netInterest: number;
  grossTotal: number;
  netTotal: number;
};

export type MonthlyAllowance = {
  monthKey: string;
  label: string;
  net: number;
  entries: Array<{
    depositId: string;
    name: string;
    bankName: string;
    payoutFrequency: PayoutFrequency;
    amountNet: number;
    principalReturned?: number;
    status: "active" | "matured" | "settled";
  }>;
};
