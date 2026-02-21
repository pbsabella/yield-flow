import type { MonthlyAllowance, DepositSummary } from "@/lib/types";
import { addMonths, formatMonthLabel, monthKey } from "@/lib/domain/date";

export function buildMonthlyAllowance(summaries: DepositSummary[]) {
  const map = new Map<string, MonthlyAllowance>();

  for (const summary of summaries) {
    const { deposit, grossInterest, netInterest } = summary;
    const start = new Date(deposit.startDate);
    const months = Math.max(deposit.termMonths, 1);
    const monthlyGross =
      deposit.payoutFrequency === "monthly" ? grossInterest / months : grossInterest;
    const monthlyNet =
      deposit.payoutFrequency === "monthly" ? netInterest / months : netInterest;

    const payoutCount = deposit.payoutFrequency === "monthly" ? months : 1;
    for (let i = 0; i < payoutCount; i += 1) {
      const payoutDate =
        deposit.payoutFrequency === "monthly"
          ? addMonths(start, i + 1)
          : addMonths(start, months);
      const key = monthKey(payoutDate);
      const label = formatMonthLabel(payoutDate);
      const current = map.get(key) ?? {
        monthKey: key,
        label,
        gross: 0,
        net: 0,
        entries: [],
      };
      current.gross += monthlyGross;
      current.net += monthlyNet;
      current.entries?.push({
        depositId: deposit.id,
        name: deposit.name,
        bankName: summary.bank.name,
        payoutFrequency: deposit.payoutFrequency,
        amountGross: monthlyGross,
        amountNet: monthlyNet,
      });
      map.set(key, current);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
