"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { RenewalMode } from "@/lib/domain/renew";

type Choice = "withdraw" | "renew-all" | "renew-principal";

type Props = {
  summary: EnrichedSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  onRenew: (summary: EnrichedSummary, mode: RenewalMode) => void;
};

export function SettleConfirmDialog({ summary, open, onOpenChange, onConfirm, onRenew }: Props) {
  const { fmtCurrency } = useFormatterContext();
  const [choice, setChoice] = useState<Choice | null>(null);

  if (!summary) return null;

  const { deposit, netInterest, netTotal } = summary;
  const isMonthly = deposit.payoutFrequency === "monthly";

  const options: { value: Choice; label: string; subtitle: string }[] = isMonthly
    ? [
        {
          value: "withdraw",
          label: "Withdraw",
          subtitle: `Take the full proceeds out — ${fmtCurrency(netTotal)}`,
        },
        {
          value: "renew-all",
          label: "Renew",
          subtitle: "Interest is already paid monthly — renew the principal for a new term",
        },
      ]
    : [
        {
          value: "withdraw",
          label: "Withdraw",
          subtitle: `Take the full proceeds out — ${fmtCurrency(netTotal)}`,
        },
        {
          value: "renew-all",
          label: "Renew everything",
          subtitle: `Reinvest ${fmtCurrency(netTotal)} for a new term`,
        },
        {
          value: "renew-principal",
          label: "Renew principal only",
          subtitle: `Reinvest ${fmtCurrency(deposit.principal)}; take ${fmtCurrency(netInterest)} now`,
        },
      ];

  const handleContinue = () => {
    if (!choice) return;
    if (choice === "withdraw") {
      onConfirm(deposit.id);
      return;
    }
    onRenew(summary, choice === "renew-all" ? "all" : "principal-only");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>What would you like to do with {deposit.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1 text-sm w-full">
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

        <RadioGroup
          value={choice ?? ""}
          onValueChange={(value) => setChoice(value as Choice)}
          className="gap-2"
          aria-label="Maturity decision"
        >
          {options.map(({ value, label, subtitle }) => (
            <label
              key={value}
              htmlFor={`maturity-choice-${value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent-hover-bg/50 min-h-11",
                choice === value ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <RadioGroupItem id={`maturity-choice-${value}`} value={value} className="mt-0.5 shrink-0" />
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground text-balance">{subtitle}</p>
              </div>
            </label>
          ))}
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={choice === null} onClick={handleContinue}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
