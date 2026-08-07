"use client";

import { useState } from "react";
import { Banknote, CircleDollarSign, Repeat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { RadioGroup } from "@/components/ui/radio-group";
import { RadioCard } from "@/components/ui/radio-card";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { getRenewalOptions, type RenewalMode } from "@/lib/domain/renew";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";

type Choice = "withdraw" | RenewalMode;

type ChoiceOption = { value: Choice; label: string; subtitle: string; icon: LucideIcon };

type Props = {
  summary: EnrichedSummary;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => void;
  onRenew: (summary: EnrichedSummary, mode: RenewalMode) => void;
};

export function MaturityDecisionDialog({ summary, onOpenChange, onConfirm, onRenew }: Props) {
  const { fmtCurrency } = useFormatterContext();
  const [choice, setChoice] = useState<Choice | null>(null);

  const { deposit, netInterest, netTotal } = summary;
  const isMonthly = deposit.payoutFrequency === "monthly";

  const options: ChoiceOption[] = [
    {
      value: "withdraw",
      label: "Withdraw",
      subtitle: `Take the full proceeds out — ${fmtCurrency(netTotal)}`,
      icon: Banknote,
    },
    ...getRenewalOptions(deposit).map(
      (mode): ChoiceOption =>
        mode === "all"
          ? {
              value: "all",
              label: isMonthly ? "Renew" : "Renew everything",
              subtitle: isMonthly
                ? "Interest is already paid monthly — renew the principal for a new term"
                : `Reinvest ${fmtCurrency(netTotal)} for a new term`,
              icon: Repeat,
            }
          : {
              value: "principal-only",
              label: "Renew principal only",
              subtitle: `Reinvest ${fmtCurrency(deposit.principal)}; take ${fmtCurrency(netInterest)} now`,
              icon: CircleDollarSign,
            },
    ),
  ];

  const handleContinue = () => {
    if (!choice) return;
    if (choice === "withdraw") {
      onConfirm(deposit.id);
      return;
    }
    onRenew(summary, choice);
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
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
          className="gap-stack-xs"
          aria-label="Maturity decision"
        >
          {options.map(({ value, label, subtitle, icon }) => (
            <RadioCard
              key={value}
              id={`maturity-choice-${value}`}
              value={value}
              selected={choice === value}
              label={label}
              description={subtitle}
              icon={icon}
              className="min-h-11"
            />
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
