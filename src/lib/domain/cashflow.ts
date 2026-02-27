// Precondition: summaries must NOT include settled deposits.
// Filter them out in the caller (e.g. usePortfolioData) before passing here.
import type { MonthlyAllowance, DepositSummary, TimeDeposit } from "@/types";
import { addMonths, formatMonthLabel, monthKey, parseLocalDate } from "@/lib/domain/date";

// Rolling window for open-ended deposit projections.
const OPEN_ENDED_PROJECTION_MONTHS = 12;

// Accepts plain DepositSummary or EnrichedSummary (which carries effectiveStatus).
// effectiveStatus is the runtime-derived status (e.g. "active" → "matured" on due date)
// and takes precedence over the stored deposit.status so that "Due now" badges and
// the "pending" pill in KPI cards reflect the actual state without requiring a storage write.
type SummaryInput = DepositSummary & { effectiveStatus?: TimeDeposit["status"] };

export function buildMonthlyAllowance(summaries: SummaryInput[]) {
  const map = new Map<string, MonthlyAllowance>();
  const today = new Date();

  for (const summary of summaries) {
    const { deposit, netInterest } = summary;

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
        // correctly surfaced as "matured" in the KPI pending pill and "Due now" badge.
        status: summary.effectiveStatus ?? deposit.status,
      });
      map.set(key, current);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
