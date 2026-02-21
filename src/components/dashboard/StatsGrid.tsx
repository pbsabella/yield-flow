import type { DepositSummary } from "@/lib/types";
import { formatDate } from "@/lib/domain/date";

const currency = "PHP";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  summaries: DepositSummary[];
  totalPrincipal: number;
  currentMonthGross: number;
  currentMonthNet: number;
  currentMonthLabel: string;
};

export default function StatsGrid({
  summaries,
  totalPrincipal,
  currentMonthGross,
  currentMonthNet,
  currentMonthLabel,
}: Props) {
  const nextMaturity = summaries[0];

  return (
    <div className="flex flex-wrap gap-4">
      <div className="border-subtle bg-surface min-w-[220px] flex-1 rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">Total principal</p>
        <p className="font-financial mt-3 text-2xl font-semibold">
          {formatCurrency(totalPrincipal)}
        </p>
      </div>
      <div className="border-subtle bg-surface min-w-[220px] flex-1 rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">
          Expected this month · {currentMonthLabel}
        </p>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs tracking-wide uppercase">Gross</p>
            <p className="font-financial text-xl font-semibold">
              {formatCurrency(currentMonthGross)}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
              Net
            </p>
            <p className="font-financial text-xl font-semibold text-indigo-700 dark:text-indigo-400">
              {formatCurrency(currentMonthNet)}
            </p>
          </div>
        </div>
        <p className="text-muted mt-2 text-xs">Across scheduled payouts</p>
      </div>
      <div className="border-subtle bg-surface min-w-[220px] flex-1 rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">Next maturity</p>
        <p className="font-financial mt-3 text-xl font-semibold">
          {nextMaturity ? formatDate(new Date(nextMaturity.maturityDate)) : "—"}
        </p>
        <p className="mt-1 text-xs text-sky-700 dark:text-sky-400">
          {nextMaturity?.bank.name}
        </p>
      </div>
    </div>
  );
}
