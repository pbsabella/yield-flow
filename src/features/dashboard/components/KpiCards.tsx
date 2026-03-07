import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { formatDate, formatMonthLabel, parseLocalDate } from "@/lib/domain/date";
import type { CurrentMonthBreakdown, NextMaturity } from "@/features/portfolio/hooks/usePortfolioData";

type KpiCardsProps = {
  totalPrincipal: number;
  currentMonthBreakdown: CurrentMonthBreakdown;
  nextMaturity: NextMaturity | null;
};

export function KpiCards({ totalPrincipal, currentMonthBreakdown, nextMaturity }: KpiCardsProps) {
  const { fmtCurrency } = useFormatterContext();
  const { net: incomeThisMonth, pendingNet, settledNet } = currentMonthBreakdown;
  const hasPills = incomeThisMonth > 0 && (pendingNet > 0 || settledNet > 0);
  // useMemo so new Date() isn't called on every re-render. The month label
  // is stable for the duration of the session.
  const monthLabel = useMemo(() => formatMonthLabel(new Date()), []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-md">
      {/* Total Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {fmtCurrency(totalPrincipal)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Excludes settled.</p>
        </CardContent>
      </Card>

      {/* Income This Month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Income This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {fmtCurrency(incomeThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Net interest · {monthLabel}</p>
          {hasPills && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {pendingNet > 0 && (
                <Badge variant="warning">{fmtCurrency(pendingNet)} pending</Badge>
              )}
              {settledNet > 0 && (
                <Badge variant="success">{fmtCurrency(settledNet)} settled</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Maturity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Next Maturity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextMaturity ? (
            <>
              <div className="text-2xl font-semibold">
                {formatDate(parseLocalDate(nextMaturity.maturityDate))}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {nextMaturity.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {nextMaturity.bankName} · {fmtCurrency(nextMaturity.netProceeds)} net
              </p>
            </>
          ) : (
            <div className="text-2xl font-semibold text-muted-foreground">
              —
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
