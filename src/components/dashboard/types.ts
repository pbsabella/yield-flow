import type { TimeDeposit } from "@/lib/types";

export type ProductType = "td-maturity" | "td-monthly" | "savings";
export type TermInputMode = "months" | "end-date";

export type TierInput = {
  id: string;
  upTo: string;
  rate: string;
};

export type DepositFormState = {
  bankId: string;
  bankName: string;
  productId: string;
  productType: ProductType | "";
  name: string;
  principal: string;
  startDate: string;
  isOpenEnded: boolean;
  termMonths: string;
  endDate: string;
  termInputMode: TermInputMode;
  payoutFrequency: "monthly" | "maturity";
  compounding: "daily" | "monthly";
  taxRate: string;
  rate: string;
  dayCountConvention: 360 | 365;
  tieredEnabled: boolean;
  tiers: TierInput[];
  lastUpdated?: string;
  notes?: string;
  status?: TimeDeposit["status"];
};

export type DepositFormErrors = Record<string, string>;

export type DepositFormWarnings = Record<string, string>;
