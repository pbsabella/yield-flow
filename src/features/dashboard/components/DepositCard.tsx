"use client";

import { useState } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhpCurrency } from "@/lib/domain/format";
import { formatDate, differenceInCalendarDays } from "@/lib/domain/date";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/dashboard/hooks/usePortfolioData";
import type { TimeDeposit } from "@/types";

type Props = {
  summary: EnrichedSummary;
  onSettleClick: (summary: EnrichedSummary) => void;
  onDeleteClick: (id: string) => void;
  onEditClick: (deposit: TimeDeposit) => void;
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
  if (isOpenEnded)
    return <span className="text-xs text-muted-foreground">Open-ended</span>;
  if (effectiveStatus === "settled")
    return <span className="text-xs text-muted-foreground">—</span>;
  if (!maturityDate)
    return <span className="text-xs text-muted-foreground">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(new Date(maturityDate), today);

  if (days > 30)
    return (
      <span className="text-xs text-muted-foreground">
        Matures {formatDate(new Date(maturityDate))}
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

export function DepositCard({ summary, onSettleClick, onDeleteClick, onEditClick, isNew }: Props) {
  const [open, setOpen] = useState(false);
  const { deposit, bank, maturityDate, netInterest, effectiveStatus } = summary;

  const statusBadge =
    effectiveStatus === "settled" ? (
      <Badge variant="success">Settled</Badge>
    ) : effectiveStatus === "matured" ? (
      <Badge variant="warning">Matured</Badge>
    ) : (
      <Badge variant="secondary">Active</Badge>
    );

  return (
    <li>
      <article aria-labelledby={`deposit-${deposit.id}-name`}>
        <Card className={cn("p-0 transition duration-1000", isNew && "ring-2 ring-primary/40 bg-primary/5")}>
          <Collapsible open={open} onOpenChange={setOpen}>
            {/* Trigger row */}
            <CardHeader className="p-0">
              <CollapsibleTrigger className={`flex w-full items-center justify-between gap-2 px-4 py-3 hover:bg-muted${open ? " bg-primary/5" : ""}`}>
                <div className="flex items-center gap-2">
                  {statusBadge}
                  <h3
                    id={`deposit-${deposit.id}-name`}
                    className="text-sm font-medium"
                  >
                    {deposit.name}
                  </h3>
                </div>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200${open ? " rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
            </CardHeader>

            {/* Expanded details */}
            <CollapsibleContent>
              <CardContent className="grid grid-cols-2 gap-y-2 border-t py-3 text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="text-right">{bank.name}</span>

                <span className="text-muted-foreground">Principal</span>
                <span className="text-right font-medium">
                  {formatPhpCurrency(deposit.principal)}
                </span>

                <span className="text-muted-foreground">Net interest</span>
                <span className="text-right">{formatPhpCurrency(netInterest)}</span>

                <span className="text-muted-foreground">Rate</span>
                <span className="text-right">
                  {deposit.interestMode === "tiered"
                    ? "Tiered"
                    : `${(deposit.flatRate * 100).toFixed(2)}%`}
                </span>

                <span className="text-muted-foreground">Payout</span>
                <span className="text-right">
                  {deposit.payoutFrequency === "monthly" ? "Monthly" : "At maturity"}
                </span>
              </CardContent>
            </CollapsibleContent>

            {/* Footer: always visible */}
            <CardFooter className="justify-between">
              <MaturityLabel
                maturityDate={maturityDate}
                isOpenEnded={deposit.isOpenEnded}
                effectiveStatus={effectiveStatus}
              />
              <div className="flex items-center justify-end">
                {effectiveStatus === "matured" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-r-none"
                    onClick={() => onSettleClick(summary)}
                    aria-label={`Settle ${deposit.name}`}
                  >
                    Settle
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        effectiveStatus === "matured"
                          ? "rounded-l-none border-l-0 px-2"
                          : "px-2"
                      }
                      aria-label={`More options for ${deposit.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditClick(deposit)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeleteClick(deposit.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardFooter>
          </Collapsible>
        </Card>
      </article>
    </li>
  );
}
