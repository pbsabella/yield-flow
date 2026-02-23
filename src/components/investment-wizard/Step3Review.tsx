"use client";

import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { DepositFormState, DepositFormWarnings } from "@/components/dashboard/types";
import {
  decimalToPercentString,
  parseTierInputs,
  productTypeLabel,
  toNumber,
  unformatCurrencyInput,
} from "@/components/dashboard/utils";
import { buildDepositSummary } from "@/lib/domain/interest";
import { formatDate, toISODate } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";
import type { Bank, TimeDeposit } from "@/lib/types";

function buildPreviewSummary(form: DepositFormState, bank: Bank) {
  const principal = toNumber(unformatCurrencyInput(form.principal));
  const rate = toNumber(form.rate);
  const hasTieredRate =
    form.tieredEnabled && form.tiers.some((t) => toNumber(t.rate) > 0);
  if (principal <= 0 || (rate <= 0 && !hasTieredRate)) return null;

  const tiers = form.tieredEnabled ? parseTierInputs(form.tiers) : [{ upTo: null, rate }];

  if (tiers.length === 0) return null;

  const previewDeposit: TimeDeposit = {
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

  return buildDepositSummary(previewDeposit, bank);
}

type Step3ReviewProps = {
  form: DepositFormState;
  bank: Bank | undefined;
  warnings: DepositFormWarnings;
  isEditMode: boolean;
  onGoToStep1: () => void;
};

export default function Step3Review({
  form,
  bank,
  warnings,
  isEditMode,
  onGoToStep1,
}: Step3ReviewProps) {
  const resolvedBank = useMemo(
    (): Bank =>
      bank ?? {
        id: form.bankId || "preview-bank",
        name: form.bankName || "Custom bank",
        taxRate: 0.2,
      },
    [bank, form.bankId, form.bankName],
  );

  const previewSummary = useMemo(
    () => buildPreviewSummary(form, resolvedBank),
    [form, resolvedBank],
  );

  const monthlyNet = useMemo(() => {
    if (!previewSummary) return 0;
    if (form.payoutFrequency !== "monthly") return 0;
    const divisor = Math.max(1, toNumber(form.termMonths || "12"));
    return previewSummary.netInterest / divisor;
  }, [form.payoutFrequency, form.termMonths, previewSummary]);

  return (
    <section className="space-y-5" aria-label="Step 3 Review and Confirm">
      <div>
        <h3 className="text-sm font-semibold">Step 3 - Review &amp; Confirm</h3>
        <p className="text-muted-foreground text-xs">Review your inputs before saving.</p>
      </div>

      {/* Step 1 summary */}
      <div className="border-border bg-surface-soft space-y-2 rounded-md border p-3 text-xs">
        <div className="flex items-center justify-between">
          <p className="text-foreground font-semibold">Step 1 summary</p>
          <Button type="button" variant="ghost" size="sm" onClick={onGoToStep1}>
            Change
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Bank</span>
          <span className="font-medium">{form.bankName || "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Product</span>
          <span className="font-medium">{productTypeLabel(form.productType) || "-"}</span>
        </div>
      </div>

      {/* Investment detail summary */}
      <div className="border-border bg-surface-soft space-y-2 rounded-md border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Investment name</span>
          <span className="font-medium">{form.name || "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Principal</span>
          <span className="font-financial font-medium">
            {formatPhpCurrency(toNumber(unformatCurrencyInput(form.principal)))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rate</span>
          <span className="font-financial font-medium">
            {decimalToPercentString(form.rate)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Withholding tax</span>
          <span className="font-financial font-medium">
            {decimalToPercentString(form.taxRate)}%
          </span>
        </div>
      </div>

      {/* Live calculation result */}
      {previewSummary ? (
        <div className="border-status-info-border bg-status-info-bg space-y-2 rounded-md border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Gross interest</span>
            <span className="font-financial">
              {formatPhpCurrency(previewSummary.grossInterest)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tax withheld</span>
            <span className="font-financial">
              {formatPhpCurrency(
                previewSummary.grossInterest - previewSummary.netInterest,
              )}
            </span>
          </div>
          <div className="text-income-net-fg flex items-center justify-between">
            <span className="font-semibold">Net interest</span>
            <span className="font-financial font-semibold">
              {formatPhpCurrency(previewSummary.netInterest)}
            </span>
          </div>
          {!form.isOpenEnded ? (
            <div className="flex items-center justify-between">
              <span>Maturity date</span>
              <span className="font-financial">
                {formatDate(new Date(previewSummary.maturityDate))}
              </span>
            </div>
          ) : null}
          {form.payoutFrequency === "monthly" ? (
            <div className="flex items-center justify-between">
              <span>Monthly net interest</span>
              <span className="font-financial">{formatPhpCurrency(monthlyNet)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {warnings.pdic ? (
        <Alert variant="warning">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{warnings.pdic}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-muted-foreground text-xs">
        {isEditMode
          ? 'Click "Save changes" below to update this investment.'
          : 'Click "Add investment" below to save.'}
      </p>
    </section>
  );
}
