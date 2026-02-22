import type { DepositSummary } from "@/lib/types";
import { formatDate } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";

type Props = {
  totalPrincipal: number;
  currentMonthIncomeTotal: number;
  currentMonthIncomePending: number;
  currentMonthIncomeSettled: number;
  currentMonthLabel: string;
  nextMaturity?: DepositSummary | null;
};

export default function StatsGrid({
  totalPrincipal,
  currentMonthIncomeTotal,
  currentMonthIncomePending,
  currentMonthIncomeSettled,
  currentMonthLabel,
  nextMaturity,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="border-subtle bg-surface rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">Total Principal</p>
        <p className="font-financial mt-3 text-2xl font-semibold">
          {formatPhpCurrency(totalPrincipal)}
        </p>
        <p className="text-muted mt-2 text-xs">Excludes settled investments.</p>
      </div>
      <div className="border-subtle bg-surface rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">Income This Month</p>
        <p className="text-muted mt-1 text-xs">Net interest · {currentMonthLabel}</p>
        <p className="font-financial mt-3 text-2xl font-semibold">
          {formatPhpCurrency(currentMonthIncomeTotal)}
        </p>
        {currentMonthIncomePending > 0 || currentMonthIncomeSettled > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {currentMonthIncomePending > 0 ? (
              <span className="bg-status-warning text-status-warning-fg ring-status-warning-border inline-flex items-center rounded-full px-2.5 py-1 ring-1">
                {formatPhpCurrency(currentMonthIncomePending)} pending
              </span>
            ) : null}
            {currentMonthIncomeSettled > 0 ? (
              <span className="bg-status-success text-status-success-fg ring-status-success-border inline-flex items-center rounded-full px-2.5 py-1 ring-1">
                {formatPhpCurrency(currentMonthIncomeSettled)} settled
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="border-subtle bg-surface rounded-2xl border px-5 py-4 transition-colors duration-200 ease-out">
        <p className="text-muted text-xs font-medium">Next Maturity</p>
        {nextMaturity ? (
          <>
            <p className="font-financial mt-3 text-xl font-semibold">
              {formatDate(new Date(nextMaturity.maturityDate))}
            </p>
            <p className="text-muted mt-1 text-xs">
              {nextMaturity.deposit.name} · {nextMaturity.bank.name}
            </p>
            <p className="font-financial text-bank-name mt-2 text-base font-semibold">
              {formatPhpCurrency(nextMaturity.netTotal)} net proceeds
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-semibold">All settled for now</p>
            <p className="text-muted mt-1 text-xs">
              Add a new investment to see the next maturity.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
