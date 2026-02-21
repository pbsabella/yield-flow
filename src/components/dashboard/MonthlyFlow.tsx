import type { MonthlyAllowance } from "@/lib/types";
import { addMonths, formatMonthLabel, monthKey } from "@/lib/domain/date";
import { useMemo, useState } from "react";

const currency = "PHP";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  items: MonthlyAllowance[];
  currentMonthKey: string;
  currentMonthPending: number;
  currentMonthSettled: number;
};

export default function MonthlyFlow({
  items,
  currentMonthKey,
  currentMonthPending,
  currentMonthSettled,
}: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { windowItems, fullItems } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const months = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
    const itemMap = new Map(items.map((item) => [item.monthKey, item]));

    const windowed = months.map((date) => {
      const key = monthKey(date);
      const existing = itemMap.get(key);
      return (
        existing ?? {
          monthKey: key,
          label: formatMonthLabel(date),
          net: 0,
          entries: [],
        }
      );
    });

    return { windowItems: windowed, fullItems: items };
  }, [items]);

  return (
    <div className="space-y-3">
      {(showAll ? fullItems : windowItems).map((item) => {
        const isOpen = openKey === item.monthKey;
        const hasEntries = Boolean(item.entries?.length);
        const isCurrentMonth = item.monthKey === currentMonthKey;
        const pendingNet = isCurrentMonth ? currentMonthPending : 0;
        const settledNet = isCurrentMonth ? currentMonthSettled : 0;
        return (
          <div key={item.monthKey}>
            {hasEntries ? (
              <div className="border-subtle bg-item-card overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() =>
                    setOpenKey((current) =>
                      current === item.monthKey ? null : item.monthKey,
                    )
                  }
                  className="hover:bg-surface focus-visible:ring-primary/60 active:bg-surface-strong flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 ease-out focus-visible:ring-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-foreground/70 text-xs">Net Income</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="font-financial text-lg font-semibold text-indigo-700 dark:text-indigo-400">
                        {formatCurrency(item.net)}
                      </p>
                      {isCurrentMonth ? (
                        <div className="mt-2 flex flex-wrap justify-end gap-2 text-[11px] font-semibold">
                          {pendingNet > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20">
                              {formatCurrency(pendingNet)} pending
                            </span>
                          ) : null}
                          {settledNet > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20">
                              {formatCurrency(settledNet)} settled
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
                {isOpen ? (
                  <div className="border-subtle bg-surface border-t px-4 py-3">
                    <div className="text-muted mb-2 text-xs uppercase">
                      Monthly payouts
                    </div>
                    <div className="space-y-2">
                      {item.entries
                        ?.filter((entry) => entry.payoutFrequency === "monthly")
                        .map((entry) => (
                          <div
                            key={`${item.monthKey}-${entry.depositId}-monthly`}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold">
                                {entry.name} · {entry.bankName}
                              </div>
                              <div className="text-foreground/70 text-xs">
                                Net interest
                              </div>
                            </div>
                            <div className="font-financial text-right font-semibold text-indigo-700 dark:text-indigo-400">
                              {formatCurrency(entry.amountNet)}
                            </div>
                          </div>
                        ))}
                      {(item.entries?.filter(
                        (entry) => entry.payoutFrequency === "monthly",
                      ).length ?? 0) === 0 ? (
                        <p className="text-muted text-xs">No monthly payouts.</p>
                      ) : null}
                    </div>
                    <div className="text-muted mt-4 mb-2 text-xs uppercase">
                      Maturity payouts
                    </div>
                    <div className="space-y-2">
                      {item.entries
                        ?.filter((entry) => entry.payoutFrequency === "maturity")
                        .map((entry) => (
                          <div
                            key={`${item.monthKey}-${entry.depositId}-maturity`}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold">
                                {entry.name} · {entry.bankName}
                              </div>
                              <div className="text-foreground/70 text-xs">
                                Net interest
                              </div>
                            </div>
                            <div className="font-financial text-right font-semibold text-indigo-700 dark:text-indigo-400">
                              {formatCurrency(entry.amountNet)}
                            </div>
                          </div>
                        ))}
                      {(item.entries?.filter(
                        (entry) => entry.payoutFrequency === "maturity",
                      ).length ?? 0) === 0 ? (
                        <p className="text-muted text-xs">No maturity payouts.</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border-subtle bg-item-card text-muted rounded-xl border px-4 py-3 text-sm">
                No payouts in {item.label}
              </div>
            )}
          </div>
        );
      })}
      {!showAll ? (
        <button
          type="button"
          className="text-muted hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out"
          onClick={() => setShowAll(true)}
        >
          Show all
        </button>
      ) : null}
    </div>
  );
}
