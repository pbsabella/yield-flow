import type { MonthlyAllowance } from "@/types";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { Preferences } from "@/lib/hooks/usePreferences";
import { formatCurrency } from "@/lib/domain/format";
import { parseLocalDate, differenceInCalendarDays } from "@/lib/domain/date";

export type AiContextParams = {
  summaries: EnrichedSummary[];
  monthlyAllowance: MonthlyAllowance[];
  preferences: Preferences;
  today: string; // YYYY-MM-DD
  prompt: string;
  marketRates: string; // free text, may be empty
};

function fmt(value: number, currency: string): string {
  return formatCurrency(value, currency);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function fmtTiers(tiers: { upTo: number | null; rate: number }[]): string {
  if (!tiers || tiers.length === 0) return "tiered";
  const parts = tiers.map((t) => {
    const threshold = t.upTo == null ? "above" : `≤${t.upTo.toLocaleString()}`;
    return `${threshold}: ${pct(t.rate)}`;
  });
  return `tiered (${parts.join(", ")})`;
}

export function buildAiContext({
  summaries,
  monthlyAllowance,
  preferences,
  today,
  prompt,
  marketRates,
}: AiContextParams): string {
  const currency = preferences.currency;
  const limit = preferences.bankInsuranceLimit;
  const todayDate = parseLocalDate(today);
  const lines: string[] = [];

  // --- Prompt block ---
  const promptLines = prompt
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  lines.push(promptLines);
  lines.push("");

  // --- Current market rates (optional) ---
  if (marketRates.trim()) {
    lines.push("## Current Market Rates");
    lines.push("");
    lines.push(marketRates.trim());
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // --- Snapshot header ---
  lines.push(`# Portfolio Snapshot — ${today}`);
  lines.push("");
  const headerParts = [`Currency: ${currency}`];
  if (limit != null) headerParts.push(`Insurance limit: ${fmt(limit, currency)} per bank`);
  lines.push(headerParts.join(" | "));
  lines.push("");

  // --- Summary KPIs ---
  const nonSettled = summaries.filter((s) => s.effectiveStatus !== "settled");
  const active = summaries.filter((s) => s.effectiveStatus === "active");
  const overdue = summaries.filter((s) => s.effectiveStatus === "matured");
  const totalPrincipal = nonSettled.reduce((sum, s) => sum + s.deposit.principal, 0);
  const total12mNet = monthlyAllowance.reduce((sum, m) => sum + m.net, 0);

  // Next maturity: earliest active with future maturity date
  const nextMaturitySummary = active
    .filter((s) => s.maturityDate != null && parseLocalDate(s.maturityDate) > todayDate)
    .sort((a, b) => a.maturityDate!.localeCompare(b.maturityDate!))[0] ?? null;

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Active investments: ${active.length}`);
  if (overdue.length > 0) lines.push(`- Matured (unsettled — action needed): ${overdue.length}`);
  lines.push(`- Total active principal: ${fmt(totalPrincipal, currency)}`);
  lines.push(`- 12-month projected net interest: ${fmt(total12mNet, currency)}`);
  if (nextMaturitySummary) {
    const daysToNext = differenceInCalendarDays(
      parseLocalDate(nextMaturitySummary.maturityDate!),
      todayDate,
    );
    lines.push(
      `- Next maturity: **${nextMaturitySummary.deposit.name}** @ ${nextMaturitySummary.bank.name}` +
        ` on ${nextMaturitySummary.maturityDate} (${daysToNext} days) — ${fmt(nextMaturitySummary.netTotal, currency)} net proceeds`,
    );
  }
  lines.push("");

  // --- Active investments table ---
  // Per-bank totals (for limit flag)
  const bankTotals = new Map<string, number>();
  for (const s of nonSettled) {
    bankTotals.set(s.bank.id, (bankTotals.get(s.bank.id) ?? 0) + s.deposit.principal);
  }

  const tableRows = [...nonSettled].sort((a, b) => {
    // Overdue first, then by maturity ASC, open-ended last
    if (a.maturityDate == null && b.maturityDate == null) return 0;
    if (a.maturityDate == null) return 1;
    if (b.maturityDate == null) return -1;
    return a.maturityDate.localeCompare(b.maturityDate);
  });

  lines.push("## Active Investments");
  lines.push("");
  lines.push(
    "| Name | Bank | Principal | Rate | Start | Maturity | Days | Net Interest | Status |",
  );
  lines.push("|---|---|---:|---:|---|---|---:|---:|---|");

  for (const s of tableRows) {
    const { deposit, bank, maturityDate, netInterest, effectiveStatus } = s;

    let daysRemaining: string;
    let status: string;

    if (deposit.isOpenEnded) {
      daysRemaining = "open-ended";
      status = "active (open-ended)";
    } else if (maturityDate == null) {
      daysRemaining = "—";
      status = effectiveStatus;
    } else {
      const days = differenceInCalendarDays(parseLocalDate(maturityDate), todayDate);
      daysRemaining = String(days);
      if (effectiveStatus === "matured") {
        status = "**OVERDUE**";
      } else if (days <= 30) {
        status = "maturing soon";
      } else {
        status = "active";
      }
    }

    const bankTotal = bankTotals.get(bank.id) ?? 0;
    const overLimit = limit != null && bankTotal > limit;
    const bankLabel = overLimit ? `${bank.name} ⚠️` : bank.name;

    const maturityLabel = maturityDate ?? (deposit.isOpenEnded ? "open-ended" : "—");

    lines.push(
      `| ${deposit.name} | ${bankLabel} | ${fmt(deposit.principal, currency)} | ${deposit.interestMode === "tiered" ? fmtTiers(deposit.tiers) : pct(deposit.flatRate)} | ${deposit.startDate} | ${maturityLabel} | ${daysRemaining} | ${fmt(netInterest, currency)} | ${status} |`,
    );
  }
  lines.push("");

  // --- Bank exposure summary ---
  type BankGroup = { name: string; principal: number; netInterest: number };
  const bankGroups = new Map<string, BankGroup>();
  for (const s of nonSettled) {
    const key = s.bank.id;
    if (!bankGroups.has(key)) {
      bankGroups.set(key, { name: s.bank.name, principal: 0, netInterest: 0 });
    }
    const g = bankGroups.get(key)!;
    g.principal += s.deposit.principal;
    g.netInterest += s.netInterest;
  }
  const sortedBanks = [...bankGroups.values()].sort((a, b) => b.principal - a.principal);

  lines.push("## Bank Exposure");
  lines.push("");
  if (limit != null) {
    lines.push("| Bank | Principal | Net Interest | % of Limit | Status |");
    lines.push("|---|---:|---:|---:|---|");
    for (const g of sortedBanks) {
      const ratio = (g.principal / limit) * 100;
      const coverageStatus =
        ratio > 100 ? "OVER LIMIT" : ratio > 80 ? "approaching limit" : "safe";
      lines.push(
        `| ${g.name} | ${fmt(g.principal, currency)} | ${fmt(g.netInterest, currency)} | ${Math.round(ratio)}% | ${coverageStatus} |`,
      );
    }
    lines.push("");
    lines.push(`_Deposit insurance limit: ${fmt(limit, currency)} per bank_`);
  } else {
    lines.push("| Bank | Principal | Net Interest |");
    lines.push("|---|---:|---:|");
    for (const g of sortedBanks) {
      lines.push(`| ${g.name} | ${fmt(g.principal, currency)} | ${fmt(g.netInterest, currency)} |`);
    }
    lines.push("");
    lines.push("_No insurance limit configured._");
  }
  lines.push("");

  // --- 12-month cash flow ---
  lines.push("## 12-Month Cash Flow Projection");
  lines.push("");
  lines.push("| Month | Expected Net Payout | Sources |");
  lines.push("|---|---:|---|");
  for (const m of monthlyAllowance) {
    if (m.net === 0) continue;
    const sources = m.entries
      .filter((e) => e.amountNet > 0)
      .map((e) => e.name)
      .join(", ");
    lines.push(`| ${m.label} | ${fmt(m.net, currency)} | ${sources} |`);
  }
  lines.push("");

  // --- Flags / warnings ---
  const flags: string[] = [];

  for (const s of overdue) {
    flags.push(
      `**${s.deposit.name}** (${s.bank.name}) matured on ${s.maturityDate} — unsettled, action required.`,
    );
  }

  const maturingSoon = active.filter((s) => {
    if (!s.maturityDate) return false;
    const days = differenceInCalendarDays(parseLocalDate(s.maturityDate), todayDate);
    return days >= 0 && days <= 30;
  });
  for (const s of maturingSoon) {
    const days = differenceInCalendarDays(parseLocalDate(s.maturityDate!), todayDate);
    flags.push(
      `**${s.deposit.name}** (${s.bank.name}) matures in ${days} day${days !== 1 ? "s" : ""} on ${s.maturityDate} — renewal decision needed.`,
    );
  }

  if (limit != null) {
    for (const g of sortedBanks) {
      if (g.principal > limit) {
        flags.push(
          `**${g.name}** total principal ${fmt(g.principal, currency)} exceeds insurance limit of ${fmt(limit, currency)}.`,
        );
      }
    }
  }

  if (flags.length > 0) {
    lines.push("## Flags");
    lines.push("");
    for (const f of flags) lines.push(`- ${f}`);
    lines.push("");
  }

  return lines.join("\n");
}
