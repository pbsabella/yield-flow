import type { Bank, TimeDeposit } from "@/types";

const today = new Date();

function daysAgo(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function daysFromNow(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function monthsAgo(months: number): string {
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

export const banks: Bank[] = [
  { id: "cimb", name: "CIMB", taxRate: 0.2 },
  { id: "cimb-prime", name: "CIMB Prime", taxRate: 0.2 },
  { id: "tonik", name: "Tonik", taxRate: 0.2 },
  { id: "ownbank", name: "OwnBank", taxRate: 0.2 },
  { id: "maribank", name: "MariBank", taxRate: 0.2 },
  { id: "maya", name: "Maya", taxRate: 0.2 },
  { id: "uno", name: "Uno", taxRate: 0.2 },
];

export const deposits: TimeDeposit[] = [
  // ─────────────────────────────────────────────
  // OVERDUE + SETTLED — matured in Feb 2026, user has clicked Settle
  // Tests: settled pill on Income This Month, excluded from Total Principal
  // ─────────────────────────────────────────────
  {
    id: "td-overdue-settled-001",
    bankId: "cimb",
    name: "CIMB - 3M (Settled)",
    principal: 250000,
    startDate: monthsAgo(3),
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.045,
    tiers: [{ upTo: null, rate: 0.045 }],
    payoutFrequency: "maturity",
    status: "settled",
  },

  // ─────────────────────────────────────────────
  // OVERDUE + UNSETTLED — matured in Feb 2026, user has NOT settled yet
  // Tests: yellow highlight, Settle CTA, pending pill on Income This Month,
  //        still counts toward Total Principal
  // ─────────────────────────────────────────────
  {
    id: "td-overdue-pending-001",
    bankId: "tonik",
    name: "Tonik - 6M (Overdue)",
    principal: 100000,
    startDate: monthsAgo(6),
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.055,
    tiers: [{ upTo: null, rate: 0.055 }],
    payoutFrequency: "maturity",
    status: "matured",
  },

  // ─────────────────────────────────────────────
  // MATURING SOON — within the next 7 days
  // Tests: Next Maturity card with a real near-term date
  // ─────────────────────────────────────────────
  {
    id: "td-soon-001",
    bankId: "ownbank",
    name: "OwnBank - 30D",
    principal: 250000,
    startDate: daysAgo(25),
    termMonths: 1,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.048,
    tiers: [{ upTo: null, rate: 0.048 }],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // SHORT TERM — 1 month, simple flat rate, maturity payout
  // Tests: shortest possible TD, edge cases in interest calculation
  // ─────────────────────────────────────────────
  {
    id: "td-short-001",
    bankId: "cimb-prime",
    name: "CIMB Prime - 1M",
    principal: 100000,
    startDate: daysAgo(10),
    termMonths: 1,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.035,
    tiers: [{ upTo: null, rate: 0.035 }],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // MID TERM — 3–6 months, flat rate, maturity payout
  // ─────────────────────────────────────────────
  {
    id: "td-mid-001",
    bankId: "cimb",
    name: "CIMB - 3M",
    principal: 250000,
    startDate: daysAgo(5),
    termMonths: 3,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.045,
    tiers: [{ upTo: null, rate: 0.045 }],
    payoutFrequency: "maturity",
    status: "active",
  },
  {
    id: "td-mid-002",
    bankId: "cimb-prime",
    name: "CIMB Prime - 6M",
    principal: 500000,
    startDate: daysAgo(45),
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.052,
    tiers: [{ upTo: null, rate: 0.052 }],
    payoutFrequency: "maturity",
    status: "active",
  },
  {
    id: "td-mid-003",
    bankId: "ownbank",
    name: "OwnBank - 180D",
    principal: 210000,
    startDate: daysAgo(18),
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.048,
    tiers: [{ upTo: null, rate: 0.048 }],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // LONG TERM — 12+ months, flat rate, maturity payout
  // ─────────────────────────────────────────────
  {
    id: "td-long-001",
    bankId: "tonik",
    name: "Tonik - 12M",
    principal: 320000,
    startDate: monthsAgo(1),
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.065,
    tiers: [{ upTo: null, rate: 0.065 }],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // TIERED RATE — maturity payout
  // Tests: tiered interest calculation at end of term (not open-ended)
  // ─────────────────────────────────────────────
  {
    id: "td-tiered-maturity-001",
    bankId: "cimb",
    name: "CIMB - Tiered 6M",
    principal: 350000,
    startDate: daysAgo(18),
    termMonths: 6,
    interestMode: "tiered",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.045,
    tiers: [
      { upTo: 200000, rate: 0.045 },
      { upTo: null, rate: 0.055 },
    ],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // MONTHLY PAYOUT — fixed term
  // Tests: interest paid monthly, principal returned only at maturity
  // ─────────────────────────────────────────────
  {
    id: "td-monthly-001",
    bankId: "uno",
    name: "UnoEarn - 24M",
    principal: 280000,
    startDate: daysAgo(16),
    termMonths: 24,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.05,
    tiers: [{ upTo: null, rate: 0.05 }],
    payoutFrequency: "monthly",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // OPEN-ENDED — no maturity date, monthly payout, tiered rate
  // Tests: ongoing investments with no end date in timeline + cash flow
  // ─────────────────────────────────────────────
  {
    id: "td-open-001",
    bankId: "maya",
    name: "Maya - SA",
    principal: 140000,
    startDate: monthsAgo(1),
    termMonths: 12,
    interestMode: "tiered",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.1,
    tiers: [
      { upTo: 100000, rate: 0.1 },
      { upTo: null, rate: 0.035 },
    ],
    payoutFrequency: "monthly",
    isOpenEnded: true,
    status: "active",
  },
  {
    id: "td-open-002",
    bankId: "maribank",
    name: "MariBank - Daily Saver",
    principal: 1150000,
    startDate: monthsAgo(1),
    termMonths: 12,
    interestMode: "tiered",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.0325,
    tiers: [
      { upTo: 1000000, rate: 0.0325 },
      { upTo: null, rate: 0.0375 },
    ],
    payoutFrequency: "monthly",
    isOpenEnded: true,
    status: "active",
  },
];
