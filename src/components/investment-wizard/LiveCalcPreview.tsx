"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import type { Bank, InterestTier, TimeDeposit } from "@/lib/types";
import type { DepositFormState } from "@/components/dashboard/types";
import {
  parseTierInputs,
  toNumber,
  unformatCurrencyInput,
} from "@/components/dashboard/utils";
import { buildDepositSummary } from "@/lib/domain/interest";
import { formatDate, toISODate } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debouncedValue;
}

function buildTierBreakdown(principal: number, tiers: InterestTier[]) {
  const sorted = [...tiers].sort((a, b) => {
    if (a.upTo === null) return 1;
    if (b.upTo === null) return -1;
    return a.upTo - b.upTo;
  });

  let remaining = principal;
  let lastThreshold = 0;

  return sorted
    .map((tier, index) => {
      const cap = tier.upTo ?? Infinity;
      const available = Math.max(cap - lastThreshold, 0);
      const amount = Math.max(0, Math.min(remaining, available));
      remaining -= amount;
      lastThreshold = cap;
      return {
        id: `tier-breakdown-${index}`,
        label:
          tier.upTo === null ? "Final tier" : `Up to ${formatPhpCurrency(tier.upTo)}`,
        amount,
        rate: tier.rate,
      };
    })
    .filter((tier) => tier.amount > 0);
}

function buildPreviewDeposit(form: DepositFormState): TimeDeposit | null {
  const principal = toNumber(unformatCurrencyInput(form.principal));
  const rate = toNumber(form.rate);
  const hasTieredRate =
    form.tieredEnabled && form.tiers.some((t) => toNumber(t.rate) > 0);
  if (principal <= 0 || (rate <= 0 && !hasTieredRate)) return null;

  const tiers = form.tieredEnabled ? parseTierInputs(form.tiers) : [{ upTo: null, rate }];

  if (tiers.length === 0) return null;

  return {
    id: "preview",
    bankId: form.bankId || "preview-bank",
    name: form.name || "New investment",
    principal,
    startDate: form.startDate || toISODate(new Date()),
    termMonths: Math.max(0.1, toNumber(form.termMonths || "12")),
    interestMode: form.tieredEnabled ? "tiered" : "simple",
    interestTreatment: form.payoutFrequency === "monthly" ? "payout" : "reinvest",
    compounding: form.compounding,
    taxRateOverride: toNumber(form.taxRate),
    flatRate: rate,
    tiers,
    payoutFrequency: form.isOpenEnded ? "monthly" : form.payoutFrequency,
    dayCountConvention: form.dayCountConvention,
    isOpenEnded: form.isOpenEnded,
  };
}

type LiveCalcPreviewProps = {
  draftForm: DepositFormState;
  bank: Bank | undefined;
};

export default function LiveCalcPreview({ draftForm, bank }: LiveCalcPreviewProps) {
  const debouncedForm = useDebouncedValue(draftForm, 300);

  const previewDeposit = useMemo(
    () => buildPreviewDeposit(debouncedForm),
    [debouncedForm],
  );

  const resolvedBank = useMemo((): Bank => {
    if (bank) return bank;
    return {
      id: debouncedForm.bankId || "preview-bank",
      name: debouncedForm.bankName || "Custom bank",
      taxRate: 0.2,
    };
  }, [bank, debouncedForm.bankId, debouncedForm.bankName]);

  const previewSummary = useMemo(() => {
    if (!previewDeposit) return null;
    return buildDepositSummary(previewDeposit, resolvedBank);
  }, [previewDeposit, resolvedBank]);

  const previewTierBreakdown = useMemo(() => {
    if (!debouncedForm.tieredEnabled) return [];
    const principal = toNumber(unformatCurrencyInput(debouncedForm.principal));
    if (principal <= 0) return [];
    return buildTierBreakdown(principal, parseTierInputs(debouncedForm.tiers));
  }, [debouncedForm.principal, debouncedForm.tieredEnabled, debouncedForm.tiers]);

  const monthlyNet = useMemo(() => {
    if (!previewSummary) return 0;
    if (debouncedForm.payoutFrequency !== "monthly") return 0;
    const divisor = Math.max(1, toNumber(debouncedForm.termMonths || "12"));
    return previewSummary.netInterest / divisor;
  }, [debouncedForm.payoutFrequency, debouncedForm.termMonths, previewSummary]);

  const desktopPanel = (
    <aside className="bg-surface-base border-border-subtle sticky top-0 rounded-xl border p-5 lg:top-6">
      <div className="text-secondary-foreground flex items-center gap-2 text-sm font-semibold">
        <Calculator className="text-income-net-fg h-4 w-4" />
        Live calculation preview
      </div>
      {!previewSummary ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Enter principal and rate to see your projection
        </p>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Gross interest</span>
            <span className="font-financial">
              {formatPhpCurrency(previewSummary.grossInterest)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax withheld</span>
            <span className="font-financial">
              {formatPhpCurrency(
                previewSummary.grossInterest - previewSummary.netInterest,
              )}
            </span>
          </div>
          <div className="bg-status-info-bg flex items-center justify-between rounded-md px-3 py-2">
            <span className="text-status-info-fg font-medium">Net interest</span>
            <span className="text-income-net-fg font-financial font-semibold">
              {formatPhpCurrency(previewSummary.netInterest)}
            </span>
          </div>
          {!debouncedForm.isOpenEnded ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Maturity date</span>
              <span className="font-financial">
                {formatDate(new Date(previewSummary.maturityDate))}
              </span>
            </div>
          ) : null}
          {debouncedForm.payoutFrequency === "monthly" ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly net interest</span>
              <span className="font-financial">{formatPhpCurrency(monthlyNet)}</span>
            </div>
          ) : null}

          {previewTierBreakdown.length > 0 ? (
            <div className="border-border bg-surface-soft space-y-2 rounded-md border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Tier allocation
              </p>
              {previewTierBreakdown.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {tier.label} · {(tier.rate * 100).toFixed(2)}%
                  </span>
                  <span className="font-financial">{formatPhpCurrency(tier.amount)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </aside>
  );

  const mobileCard = previewSummary ? (
    <div className="border-border bg-surface-soft rounded-lg border px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Net interest</span>
        <span className="text-income-net-fg font-financial text-sm font-semibold">
          {formatPhpCurrency(previewSummary.netInterest)}
        </span>
      </div>
      {!debouncedForm.isOpenEnded ? (
        <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
          <span>Matures</span>
          <span className="font-financial">
            {formatDate(new Date(previewSummary.maturityDate))}
          </span>
        </div>
      ) : null}
      {debouncedForm.payoutFrequency === "monthly" && monthlyNet > 0 ? (
        <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
          <span>Monthly net</span>
          <span className="font-financial">{formatPhpCurrency(monthlyNet)}</span>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {previewSummary
          ? `Net interest ${formatPhpCurrency(previewSummary.netInterest)}${
              debouncedForm.isOpenEnded
                ? ""
                : `. Maturity date ${formatDate(new Date(previewSummary.maturityDate))}`
            }`
          : "Enter principal and rate to see your projection"}
      </p>
      {/* Desktop: sticky sidebar in right column */}
      <div className="order-first hidden lg:order-last lg:block">{desktopPanel}</div>
      {/* Mobile: inline card above form fields (order-first pushes it above order-last step content) */}
      {mobileCard ? <div className="order-first lg:hidden">{mobileCard}</div> : null}
    </>
  );
}
