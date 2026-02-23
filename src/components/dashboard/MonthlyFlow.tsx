import type { MonthlyAllowance } from "@/lib/types";
import { addMonths, formatMonthLabel, monthKey } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

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
              <div className="border-border-subtle bg-surface-item-card overflow-hidden rounded-xl border">
                <button
                  type="button"
                  onClick={() =>
                    setOpenKey((current) =>
                      current === item.monthKey ? null : item.monthKey,
                    )
                  }
                  className="hover:bg-surface-base focus-visible:ring-primary/60 active:bg-surface-raised flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-3 text-left transition-colors duration-150 ease-out focus-visible:ring-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-foreground/70 text-xs">Net Income</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="text-income-net-fg font-financial text-lg font-semibold">
                        {formatPhpCurrency(item.net)}
                      </p>
                      {isCurrentMonth ? (
                        <div className="text-badge mt-2 flex flex-wrap justify-end gap-2 font-semibold">
                          {pendingNet > 0 ? (
                            <span className="bg-status-warning-bg text-status-warning-fg ring-status-warning-border inline-flex items-center rounded-full px-2 py-1 ring-1">
                              {formatPhpCurrency(pendingNet)} pending
                            </span>
                          ) : null}
                          {settledNet > 0 ? (
                            <span className="bg-status-success-bg text-status-success-fg ring-status-success-border inline-flex items-center rounded-full px-2 py-1 ring-1">
                              {formatPhpCurrency(settledNet)} settled
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
                {isOpen ? (
                  <div className="border-border-subtle bg-surface-base border-t px-4 py-3">
                    <div className="text-muted-foreground mb-2 text-xs uppercase">
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
                            <div className="text-income-net-fg font-financial text-right font-semibold">
                              {formatPhpCurrency(entry.amountNet)}
                            </div>
                          </div>
                        ))}
                      {(item.entries?.filter(
                        (entry) => entry.payoutFrequency === "monthly",
                      ).length ?? 0) === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          No monthly payouts.
                        </p>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground mt-4 mb-2 text-xs uppercase">
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
                            <div className="text-income-net-fg font-financial text-right font-semibold">
                              {formatPhpCurrency(entry.amountNet)}
                            </div>
                          </div>
                        ))}
                      {(item.entries?.filter(
                        (entry) => entry.payoutFrequency === "maturity",
                      ).length ?? 0) === 0 ? (
                        <p className="text-muted-foreground text-xs">
                          No maturity payouts.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="border-border-subtle bg-surface-item-card text-muted-foreground rounded-xl border px-4 py-3 text-sm">
                No payouts in {item.label}
              </div>
            )}
          </div>
        );
      })}
      {!showAll ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowAll(true)}>
          Show all
        </Button>
      ) : null}
    </div>
  );
}
