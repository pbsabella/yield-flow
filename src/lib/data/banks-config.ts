import type { InterestTier } from "@/types";

export type BankProduct = {
  id: string;
  bankId: string;
  name: string;
  productType: "td-maturity" | "td-monthly" | "savings";
  defaultRate: number;
  defaultTermMonths?: number;
  defaultPayoutFrequency: "maturity" | "monthly";
  defaultCompounding: "daily" | "monthly";
  defaultTaxRate: number;
  dayCountConvention: 360 | 365;
  isOpenEnded?: boolean;
  isTiered?: boolean;
  defaultTiers?: InterestTier[];
  lastUpdated: string;
  notes?: string;
};

export const bankTemplates = [
  { id: "tonik", name: "Tonik", taxRate: 0.2 },
  { id: "unobank", name: "UNObank", taxRate: 0.2 },
  { id: "maya", name: "Maya", taxRate: 0.2 },
  { id: "maribank", name: "MariBank", taxRate: 0.2 },
  { id: "cimb", name: "CIMB", taxRate: 0.2 },
  { id: "seabank", name: "SeaBank", taxRate: 0.2 },
  { id: "netbank", name: "Netbank", taxRate: 0.2 },
  { id: "gotyme", name: "GoTyme", taxRate: 0.2 },
  { id: "ownbank", name: "OwnBank", taxRate: 0.2 },
] as const;

export const bankProducts: BankProduct[] = [
  {
    id: "tonik-supercharged",
    bankId: "tonik",
    name: "Time Deposit (Supercharged)",
    productType: "td-maturity",
    defaultRate: 0.08,
    defaultTermMonths: 6,
    defaultPayoutFrequency: "maturity",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
  {
    id: "tonik-solo-stash",
    bankId: "tonik",
    name: "Solo Stash",
    productType: "savings",
    defaultRate: 0.04,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 365,
    isOpenEnded: true,
    lastUpdated: "2026-02",
  },
  {
    id: "uno-boost",
    bankId: "unobank",
    name: "#UNOboost",
    productType: "td-maturity",
    defaultRate: 0.055,
    defaultTermMonths: 12,
    defaultPayoutFrequency: "maturity",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
  {
    id: "uno-earn",
    bankId: "unobank",
    name: "#UNOearn",
    productType: "td-monthly",
    defaultRate: 0.05,
    defaultTermMonths: 12,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
  {
    id: "maya-savings-base",
    bankId: "maya",
    name: "Savings (Base)",
    productType: "savings",
    defaultRate: 0.035,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 365,
    isOpenEnded: true,
    isTiered: true,
    lastUpdated: "2026-02",
    notes: "Maya missions may unlock 10%–15% rates. Enter your actual rate.",
  },
  {
    id: "maya-personal-goals",
    bankId: "maya",
    name: "Personal Goals",
    productType: "td-monthly",
    defaultRate: 0.056,
    defaultTermMonths: 6,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 365,
    lastUpdated: "2026-02",
  },
  {
    id: "maribank-savings",
    bankId: "maribank",
    name: "MariBank Savings",
    productType: "savings",
    defaultRate: 0.0325,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    isOpenEnded: true,
    isTiered: true,
    defaultTiers: [
      { upTo: 1000000, rate: 0.0325 },
      { upTo: null, rate: 0.0375 },
    ],
    lastUpdated: "2026-02",
  },
  {
    id: "cimb-upsave-gsave",
    bankId: "cimb",
    name: "UpSave / GSave",
    productType: "savings",
    defaultRate: 0.046,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    isOpenEnded: true,
    lastUpdated: "2026-02",
  },
  {
    id: "cimb-maxsave-td",
    bankId: "cimb",
    name: "MaxSave TD",
    productType: "td-maturity",
    defaultRate: 0.0525,
    defaultTermMonths: 6,
    defaultPayoutFrequency: "maturity",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
  {
    id: "seabank-high-yield",
    bankId: "seabank",
    name: "High Yield Savings",
    productType: "savings",
    defaultRate: 0.045,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 365,
    isOpenEnded: true,
    lastUpdated: "2026-02",
  },
  {
    id: "netbank-td",
    bankId: "netbank",
    name: "Netbank TD",
    productType: "td-maturity",
    defaultRate: 0.06,
    defaultTermMonths: 12,
    defaultPayoutFrequency: "maturity",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
  {
    id: "gotyme-go-save",
    bankId: "gotyme",
    name: "Go Save",
    productType: "savings",
    defaultRate: 0.035,
    defaultPayoutFrequency: "monthly",
    defaultCompounding: "daily",
    defaultTaxRate: 0.2,
    dayCountConvention: 365,
    isOpenEnded: true,
    lastUpdated: "2026-02",
  },
  {
    id: "ownbank-td",
    bankId: "ownbank",
    name: "OwnBank TD",
    productType: "td-maturity",
    defaultRate: 0.06,
    defaultTermMonths: 12,
    defaultPayoutFrequency: "maturity",
    defaultCompounding: "monthly",
    defaultTaxRate: 0.2,
    dayCountConvention: 360,
    lastUpdated: "2026-02",
  },
];

export function getBankProducts(bankId: string) {
  return bankProducts.filter((product) => product.bankId === bankId);
}

export function getBankProduct(productId: string) {
  return bankProducts.find((product) => product.id === productId);
}
