import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhpCurrency } from "@/lib/domain/format";
import { formatDate, formatMonthLabel } from "@/lib/domain/date";
import type { CurrentMonthBreakdown, NextMaturity } from "@/features/dashboard/hooks/usePortfolioData";

type KpiCardsProps = {
  totalPrincipal: number;
  currentMonthBreakdown: CurrentMonthBreakdown;
  nextMaturity: NextMaturity | null;
};

export function KpiCards({ totalPrincipal, currentMonthBreakdown, nextMaturity }: KpiCardsProps) {
  const { net: incomeThisMonth, pendingNet, settledNet } = currentMonthBreakdown;
  const hasPills = incomeThisMonth > 0 && (pendingNet > 0 || settledNet > 0);
  const monthLabel = formatMonthLabel(new Date());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground">
            Total Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {formatPhpCurrency(totalPrincipal)}
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
            {formatPhpCurrency(incomeThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Net interest · {monthLabel}</p>
          {hasPills && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {pendingNet > 0 && (
                <Badge variant="warning">{formatPhpCurrency(pendingNet)} pending</Badge>
              )}
              {settledNet > 0 && (
                <Badge variant="success">{formatPhpCurrency(settledNet)} settled</Badge>
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
                {formatDate(new Date(nextMaturity.maturityDate))}
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {nextMaturity.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {nextMaturity.bankName} · {formatPhpCurrency(nextMaturity.netProceeds)} net
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
