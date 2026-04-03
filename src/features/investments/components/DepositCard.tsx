"use client";

import { memo } from "react";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DepositActions } from "./DepositActions";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { formatDate, differenceInCalendarDays, parseLocalDate } from "@/lib/domain/date";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit } from "@/types";

type Props = {
  summary: EnrichedSummary;
  onSettleClick: (summary: EnrichedSummary) => void;
  onDeleteClick: (summary: EnrichedSummary) => void;
  onEditClick: (deposit: TimeDeposit) => void;
  onUnsettleClick: (id: string) => void;
  onCloseClick: (summary: EnrichedSummary) => void;
  onReopenClick: (id: string) => void;
  isNew?: boolean;
};

function MaturityLabel({
  maturityDate,
  isOpenEnded,
  effectiveStatus,
}: {
  maturityDate: string | null;
  isOpenEnded?: boolean;
  effectiveStatus: string;
}) {
  if (effectiveStatus === "settled" || effectiveStatus === "closed")
    return <span className="text-xs text-muted-foreground">—</span>;
  if (isOpenEnded)
    return <span className="text-xs text-muted-foreground">Open-ended</span>;
  if (!maturityDate)
    return <span className="text-xs text-muted-foreground">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(parseLocalDate(maturityDate), today);

  if (days > 30)
    return (
      <span className="text-xs text-muted-foreground">
        Matures {formatDate(parseLocalDate(maturityDate))}
      </span>
    );
  if (days > 0)
    return (
      <span className="text-xs font-medium text-status-warning-fg">
        Due in {days}d
      </span>
    );
  if (days === 0)
    return (
      <span className="text-xs font-medium text-status-warning-fg">
        Due today
      </span>
    );
  return (
    <span className="text-xs font-medium text-status-warning-fg">
      {Math.abs(days)}d overdue
    </span>
  );
}

export const DepositCard = memo(function DepositCard({ summary, onSettleClick, onDeleteClick, onEditClick, onUnsettleClick, onCloseClick, onReopenClick, isNew }: Props) {
  const { fmtCurrency } = useFormatterContext();
  const { deposit, bank, maturityDate, netInterest, effectiveStatus } = summary;

  return (
    <li>
      <article aria-labelledby={`deposit-${deposit.id}-name`}>
        <CollapsibleCard
          cardClassName={cn("transition duration-1000", isNew && "ring-2 ring-primary/40 bg-primary/5")}
          trigger={
            <div className="flex items-center gap-stack-xs">
              <StatusBadge status={effectiveStatus} />
              <h2
                id={`deposit-${deposit.id}-name`}
                className="text-sm font-medium"
              >
                {deposit.name}
              </h2>
            </div>
          }
          contentClassName="grid grid-cols-2 gap-y-stack-xs py-stack-sm text-sm"
          footer={
            <>
              <MaturityLabel
                maturityDate={maturityDate}
                isOpenEnded={deposit.isOpenEnded}
                effectiveStatus={effectiveStatus}
              />
              <DepositActions
                summary={summary}
                onSettle={onSettleClick}
                onUnsettle={onUnsettleClick}
                onClose={onCloseClick}
                onReopen={onReopenClick}
                onEdit={onEditClick}
                onDelete={onDeleteClick}
              />
            </>
          }
          footerClassName="justify-between"
        >
          <span className="text-muted-foreground">Bank</span>
          <span className="text-right">{bank.name}</span>

          <span className="text-muted-foreground">Principal</span>
          <span className="text-right font-medium">
            {fmtCurrency(deposit.principal)}
          </span>

          <span className="text-muted-foreground">Net interest</span>
          <span className="text-right">{fmtCurrency(netInterest)}</span>

          <span className="text-muted-foreground">Rate</span>
          <span className="text-right">
            {deposit.interestMode === "tiered"
              ? "Tiered"
              : `${(deposit.flatRate * 100).toFixed(2)}%`}
          </span>

          {!deposit.isOpenEnded && (
            <>
              <span className="text-muted-foreground">Term</span>
              <span className="text-right">
                {deposit.termDays != null
                  ? `${deposit.termDays}d`
                  : `${deposit.termMonths} mo`}
              </span>
            </>
          )}

          <span className="text-muted-foreground">Payout</span>
          <span className="text-right">
            {deposit.payoutFrequency === "monthly" ? "Monthly" : "At maturity"}
          </span>
        </CollapsibleCard>
      </article>
    </li>
  );
});
