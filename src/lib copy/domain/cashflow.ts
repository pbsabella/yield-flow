import type { MonthlyAllowance, DepositSummary } from "@/lib/types";
import { addMonths, addTermMonths, formatMonthLabel, monthKey } from "@/lib copy/domain/date";

export function buildMonthlyAllowance(summaries: DepositSummary[]) {
  const map = new Map<string, MonthlyAllowance>();

  for (const summary of summaries) {
    const { deposit, netInterest } = summary;
    const start = new Date(deposit.startDate);
    const termMonths = Math.max(deposit.termMonths, 0.1);
    const isWholeMonthTerm = Math.abs(termMonths - Math.round(termMonths)) < 1e-9;
    const payoutDates =
      deposit.payoutFrequency === "monthly"
        ? [
            ...Array.from({ length: Math.floor(termMonths) }, (_, i) =>
              addMonths(start, i + 1),
            ),
            ...(isWholeMonthTerm ? [] : [addTermMonths(start, termMonths)]),
          ]
        : [addTermMonths(start, termMonths)];
    const payoutCount = Math.max(payoutDates.length, 1);
    const payoutNet =
      deposit.payoutFrequency === "monthly" ? netInterest / payoutCount : netInterest;

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
      current.entries?.push({
        depositId: deposit.id,
        name: deposit.name,
        bankName: summary.bank.name,
        payoutFrequency: deposit.payoutFrequency,
        amountNet: payoutNet,
        principalReturned: deposit.payoutFrequency === "maturity" ? deposit.principal : 0,
        status: deposit.status ?? "active",
      });
      map.set(key, current);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
