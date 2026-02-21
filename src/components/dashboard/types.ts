import type { TimeDeposit } from "@/lib/types";

export type DepositFormState = {
  bankId: string;
  bankName: string;
  name: string;
  principal: string;
  startDate: string;
  termMonths: string;
  tenurePreset: "30d" | "60d" | "90d" | "1y" | "custom" | "open";
  termType: "fixed" | "open";
  payoutFrequency: "monthly" | "maturity";
  interestMode: "simple" | "tiered";
  interestTreatment: "reinvest" | "payout";
  compounding: "daily" | "monthly";
  taxRate: string;
  tier1Cap: string;
  tier1Rate: string;
  tier2Rate: string;
  flatRate: string;
};

export type DepositFormErrors = Record<string, string>;

export type DepositFormConfig = {
  initialValues: DepositFormState;
  toDeposit: (form: DepositFormState, id: string) => TimeDeposit;
};
