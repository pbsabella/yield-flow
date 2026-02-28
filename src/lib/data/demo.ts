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
  // RECENTLY SETTLED (Current Month)
  // Logic: Matured and settled within the last 48 hours.
  // Tests: Populates "Income This Month" with actual realized gains.
  // ─────────────────────────────────────────────
  {
    id: "td-recent-settled-001",
    bankId: "ownbank",
    name: "OwnBank - 360D Promo",
    principal: 500000,
    startDate: monthsAgo(12),
    termMonths: 12,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.075,
    tiers: [{ upTo: null, rate: 0.075 }],
    payoutFrequency: "maturity",
    status: "settled",
  },

  // ─────────────────────────────────────────────
  // MATURED + UNSETTLED (Action Required)
  // Logic: Matured last week, awaiting user action.
  // Tests: Dashboard "Action Required" list, pending income calculations.
  // ─────────────────────────────────────────────
  {
    id: "td-overdue-pending-001",
    bankId: "tonik",
    name: "Tonik - Time Deposit",
    principal: 250000,
    startDate: monthsAgo(6),
    termMonths: 6,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "maturity",
    status: "matured",
  },

  // ─────────────────────────────────────────────
  // HIGH EXPOSURE (Bank Limit Trigger)
  // Logic: Large principal in one bank to trigger PDIC/Limit warnings.
  // Tests: UI Warning badges in Sidebar/Dashboard for institutional risk.
  // ─────────────────────────────────────────────
  {
    id: "td-high-exposure-001",
    bankId: "uno",
    name: "Uno High Yield",
    principal: 1200000,
    startDate: daysAgo(15),
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
  // MATURING SOON (Next 48 Hours)
  // Logic: Strategic startDate to hit the "Next Maturity" card.
  // ─────────────────────────────────────────────
  {
    id: "td-imminent-001",
    bankId: "maya",
    name: "Maya Personal Goal",
    principal: 300000,
    startDate: daysAgo(29), // Assuming 30-day month
    termMonths: 1,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.05,
    tiers: [{ upTo: null, rate: 0.05 }],
    payoutFrequency: "maturity",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // TIERED OPEN-ENDED (Savings Multiplier)
  // Logic: High balance Maya savings to test daily tiered compounding.
  // ─────────────────────────────────────────────
  {
    id: "td-open-maya-001",
    bankId: "maya",
    name: "Maya Savings (Boosted)",
    principal: 450000,
    startDate: monthsAgo(2),
    termMonths: 12,
    interestMode: "tiered",
    interestTreatment: "payout",
    compounding: "daily",
    taxRateOverride: 0.2,
    flatRate: 0.1, // Promotional rate
    tiers: [
      { upTo: 100000, rate: 0.1 },
      { upTo: null, rate: 0.035 },
    ],
    payoutFrequency: "monthly",
    isOpenEnded: true,
    status: "active",
  },

  // ─────────────────────────────────────────────
  // RECURRING MONTHLY PAYOUT (Cash Flow Density)
  // Logic: 24-month term with monthly payout.
  // Tests: Populates the Cash Flow bar chart for the entire 12M view.
  // ─────────────────────────────────────────────
  {
    id: "td-monthly-payout-001",
    bankId: "uno",
    name: "UnoEarn - Monthly",
    principal: 400000,
    startDate: daysAgo(20),
    termMonths: 24,
    interestMode: "simple",
    interestTreatment: "payout",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.06,
    tiers: [{ upTo: null, rate: 0.06 }],
    payoutFrequency: "monthly",
    status: "active",
  },

  // ─────────────────────────────────────────────
  // MULTI-TIER MARIBANK (Institutional Anchor)
  // Logic: Large institutional balance.
  // ─────────────────────────────────────────────
  {
    id: "td-open-maribank-001",
    bankId: "maribank",
    name: "MariBank Savings",
    principal: 1500000,
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

  // ─────────────────────────────────────────────
  // SHORT-TERM REINVESTMENT
  // ─────────────────────────────────────────────
  {
    id: "td-short-002",
    bankId: "gotyme", // Assuming GoTyme exists in your bank list
    name: "GoTyme - 32D",
    principal: 150000,
    startDate: daysAgo(5),
    termMonths: 1,
    interestMode: "simple",
    interestTreatment: "reinvest",
    compounding: "monthly",
    taxRateOverride: 0.2,
    flatRate: 0.05,
    tiers: [{ upTo: null, rate: 0.05 }],
    payoutFrequency: "maturity",
    status: "active",
  },
];
