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
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";
import type { EnrichedSummary } from "@/features/dashboard/hooks/usePortfolioData";

type Props = {
  summary: EnrichedSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
};

export function SettleConfirmDialog({ summary, open, onOpenChange, onConfirm }: Props) {
  const { fmtCurrency } = usePortfolioContext();
  if (!summary) return null;

  const { deposit, netInterest, netTotal } = summary;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Settle {deposit.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Principal</span>
                <span className="font-medium text-foreground">
                  {fmtCurrency(deposit.principal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Net interest</span>
                <span className="font-medium text-foreground">
                  {fmtCurrency(netInterest)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold text-foreground gap-8">
                <span>Total proceeds</span>
                <span>{fmtCurrency(netTotal)}</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(deposit.id)}>
            Settle {fmtCurrency(netTotal)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
