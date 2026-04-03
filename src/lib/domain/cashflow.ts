/**
 * buildCashFlowProjection — forward-looking only.
 *   Pass active + matured summaries. Settled and closed deposits are excluded
 *   by the caller because their cash has already been received.
 *   Used for the 12-month chart in the Cash Flow page.
 *
 * buildCashFlowLedger — full historical + current picture.
 *   Pass all summaries. Settled entries land in their maturity month;
 *   closed entries land in their closeDate month.
 *   Used to derive currentMonthFull and currentMonthBreakdown in the KPI cards.
 */
import type { MonthlyAllowance, DepositSummary, TimeDeposit } from "@/types";
import { addMonths, formatMonthLabel, monthKey, parseLocalDate } from "@/lib/domain/date";

// Rolling window for open-ended deposit projections.
const OPEN_ENDED_PROJECTION_MONTHS = 12;

// Accepts plain DepositSummary or EnrichedSummary (which carries effectiveStatus).
// effectiveStatus is the runtime-derived status (e.g. "active" → "matured" on due date)
// and takes precedence over the stored deposit.status so that "Matured" badges and
// the "pending" pill in KPI cards reflect the actual state without requiring a storage write.
type SummaryInput = DepositSummary & { effectiveStatus?: TimeDeposit["status"] };

function buildAllowanceMap(summaries: SummaryInput[], today: Date): Map<string, MonthlyAllowance> {
  const map = new Map<string, MonthlyAllowance>();

  for (const summary of summaries) {
    const { deposit, netInterest } = summary;
    const effectiveStatus = summary.effectiveStatus ?? deposit.status;

    // Closed deposits: emit a single historical entry for the closeDate month.
    // netInterest here is already pro-rated (buildDepositSummary handles it).
    // Skip all regular payout-date generation.
    if (effectiveStatus === "closed") {
      const closeDate = deposit.closeDate;
      if (!closeDate) continue;
      const payoutDate = parseLocalDate(closeDate);
      const key = monthKey(payoutDate);
      const label = formatMonthLabel(payoutDate);
      const current = map.get(key) ?? { monthKey: key, label, net: 0, entries: [] };
      current.net += netInterest;
      current.entries.push({
        depositId: deposit.id,
        name: deposit.name,
        bankName: summary.bank.name,
        payoutFrequency: "maturity",
        amountNet: netInterest,
        principalReturned: deposit.principal,
        status: "closed",
      });
      map.set(key, current);
      continue;
    }

    // parseLocalDate ensures payout dates fall on the correct local calendar day.
    // new Date(deposit.startDate) would parse as UTC midnight, which shifts the
    // day by 1 in UTC+ timezones (e.g. March 15 at midnight UTC = March 15 at
    // 8am Manila — but addMonths then computes local methods, causing drift).
    const start = parseLocalDate(deposit.startDate);

    let payoutDates: Date[];

    if (deposit.isOpenEnded) {
      // Anchor projection to startDate so payouts fall on the same day of month
      // as the account was opened (e.g. started Jan 15 → payouts on Feb 15,
      // Mar 15…), rather than always starting from today + 1 month.
      //
      // Find the first payout month that is >= the current calendar month.
      // This means the current month IS included when a payout falls within it
      // (e.g. started Jan 10, today is Mar 20 → Mar 10 is in the current month
      // and will appear in the current-month row).
      const curMonthKey = monthKey(today);
      let firstN = 1;
      while (monthKey(addMonths(start, firstN)) < curMonthKey) {
        firstN++;
        if (firstN > 120) break; // safety cap: ignore deposits older than ~10 years
      }
      payoutDates = Array.from(
        { length: OPEN_ENDED_PROJECTION_MONTHS },
        (_, i) => addMonths(start, firstN + i),
      );
    } else {
      const termMonths = deposit.termMonths;
      const isWholeMonthTerm = Math.abs(termMonths - Math.round(termMonths)) < 1e-9;
      payoutDates =
        deposit.payoutFrequency === "monthly"
          ? [
            ...Array.from({ length: Math.floor(termMonths) }, (_, i) =>
              addMonths(start, i + 1),
            ),
            ...(isWholeMonthTerm ? [] : [addMonths(start, termMonths)]),
          ]
          : [parseLocalDate(summary.maturityDate!)];
    }

    const payoutCount = Math.max(payoutDates.length, 1);
    const payoutNet =
      deposit.payoutFrequency === "monthly" || deposit.isOpenEnded
        ? netInterest / payoutCount
        : netInterest;

    for (const payoutDate of payoutDates) {
      const key = monthKey(payoutDate);
      const label = formatMonthLabel(payoutDate);
      const current = map.get(key) ?? {
        monthKey: key,
        label,
        net: 0,
        entries: [],
      };
      current.net += payoutNet;
      current.entries.push({
        depositId: deposit.id,
        name: deposit.name,
        bankName: summary.bank.name,
        payoutFrequency: deposit.payoutFrequency,
        amountNet: payoutNet,
        principalReturned:
          !deposit.isOpenEnded && deposit.payoutFrequency === "maturity"
            ? deposit.principal
            : 0,
        // Prefer effectiveStatus (runtime-derived) over stored deposit.status so
        // a deposit whose stored status is "active" but that matures today is
        // correctly surfaced as "matured" in the KPI pending pill and "Matured" badge.
        status: effectiveStatus,
      });
      map.set(key, current);
    }
  }

  return map;
}

function sortedFromMap(map: Map<string, MonthlyAllowance>): MonthlyAllowance[] {
  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/**
 * Forward-looking 12-month projection.
 * Caller must exclude settled and closed summaries before passing here.
 */
export function buildCashFlowProjection(
  summaries: SummaryInput[],
  today = new Date(),
): MonthlyAllowance[] {
  return sortedFromMap(buildAllowanceMap(summaries, today));
}

/**
 * Full historical + current-month ledger.
 * Accepts all statuses. Settled entries land in their maturity month;
 * closed entries land in their closeDate month.
 */
export function buildCashFlowLedger(
  summaries: SummaryInput[],
  today = new Date(),
): MonthlyAllowance[] {
  return sortedFromMap(buildAllowanceMap(summaries, today));
}

/**
 * @deprecated Use buildCashFlowProjection or buildCashFlowLedger.
 * Kept temporarily so external callers (tests, ai-context) can migrate incrementally.
 */
export function buildMonthlyAllowance(
  summaries: SummaryInput[],
  today = new Date(),
): MonthlyAllowance[] {
  return sortedFromMap(buildAllowanceMap(summaries, today));
}
