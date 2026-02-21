import type { MonthlyAllowance } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

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
};

export default function MonthlyFlow({ items }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openKey === item.monthKey;
        return (
          <div
            key={item.monthKey}
            className="border-subtle bg-surface-soft overflow-hidden rounded-xl border"
          >
            <button
              type="button"
              onClick={() =>
                setOpenKey((current) =>
                  current === item.monthKey ? null : item.monthKey,
                )
              }
              className="hover:bg-surface focus-visible:ring-primary/60 flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
            >
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-foreground/70 font-financial text-xs">
                  Gross {formatCurrency(item.gross)}
                </p>
              </div>
              <div className="border-subtle bg-surface rounded-lg border px-3 py-2 text-right">
                <p className="text-foreground/70 text-[11px] font-semibold uppercase">
                  Net allowance
                </p>
                <p className="font-financial flex items-center justify-end gap-1 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                  <TrendingUp className="h-4 w-4" />
                  {formatCurrency(item.net)}
                </p>
              </div>
            </button>
            {isOpen && item.entries?.length ? (
              <div className="border-subtle bg-surface border-t px-4 py-3">
                <div className="text-muted mb-2 text-xs uppercase">Sources</div>
                <div className="space-y-2">
                  {item.entries.map((entry) => (
                    <div
                      key={`${item.monthKey}-${entry.depositId}`}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <div className="font-semibold">
                          {entry.name} · {entry.bankName}
                        </div>
                        <div className="text-foreground/70 text-xs capitalize">
                          {entry.payoutFrequency} payout
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-financial font-semibold text-indigo-700 dark:text-indigo-400">
                          {formatCurrency(entry.amountNet)}
                        </div>
                        <div className="text-foreground/70 font-financial text-xs">
                          Gross {formatCurrency(entry.amountGross)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
