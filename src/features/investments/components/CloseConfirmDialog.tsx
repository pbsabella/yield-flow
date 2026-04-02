"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { calculateAccruedToDate } from "@/lib/domain/accrued-interest";
import { formatDate, differenceInCalendarDays, parseLocalDate } from "@/lib/domain/date";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";

type Props = {
  summary: EnrichedSummary | null;
  closeDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
};

export function CloseConfirmDialog({ summary, closeDate, open, onOpenChange, onConfirm }: Props) {
  const { fmtCurrency } = useFormatterContext();
  if (!summary) return null;

  const { deposit, bank, maturityDate } = summary;

  const accrued = calculateAccruedToDate(deposit, bank, closeDate);
  const netProceeds = deposit.principal + accrued.netInterest;

  const isEarlyClose = !deposit.isOpenEnded && maturityDate !== null;
  const daysRemaining = isEarlyClose
    ? differenceInCalendarDays(parseLocalDate(maturityDate!), parseLocalDate(closeDate))
    : null;

  const title = deposit.isOpenEnded
    ? `Close ${deposit.name}?`
    : `Close ${deposit.name} early?`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              {isEarlyClose && daysRemaining !== null && daysRemaining > 0 && (
                <p className="text-status-warning-fg font-medium">
                  Closing before maturity — {formatDate(parseLocalDate(maturityDate!))}
                  {" "}({daysRemaining}d remaining)
                </p>
              )}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Principal</span>
                  <span className="font-medium text-foreground">
                    {fmtCurrency(deposit.principal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Accrued net interest</span>
                  <span className="font-medium text-foreground">
                    {fmtCurrency(accrued.netInterest)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold text-foreground gap-8">
                  <span>Net proceeds</span>
                  <span>{fmtCurrency(netProceeds)}</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(deposit.id)}
            variant="destructive"
          >
            Close Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
