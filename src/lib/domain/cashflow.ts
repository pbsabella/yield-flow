// Precondition: summaries must NOT include settled deposits.
// Filter them out in the caller (e.g. usePortfolioData) before passing here.
import type { MonthlyAllowance, DepositSummary } from "@/types";
import { addMonths, formatMonthLabel, monthKey } from "@/lib/domain/date";

// Rolling window for open-ended deposit projections.
const OPEN_ENDED_PROJECTION_MONTHS = 12;

export function buildMonthlyAllowance(summaries: DepositSummary[]) {
  const map = new Map<string, MonthlyAllowance>();
  const today = new Date();

  for (const summary of summaries) {
    const { deposit, netInterest } = summary;
    const start = new Date(deposit.startDate);

    let payoutDates: Date[];

    if (deposit.isOpenEnded) {
      // Project OPEN_ENDED_PROJECTION_MONTHS monthly payouts from today.
      payoutDates = Array.from({ length: OPEN_ENDED_PROJECTION_MONTHS }, (_, i) =>
        addMonths(today, i + 1),
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
          : [new Date(summary.maturityDate!)];
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
        status: deposit.status,
      });
      map.set(key, current);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
