"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DatePicker from "@/components/dashboard/DatePicker";
import TierBuilder from "./TierBuilder";
import type {
  DepositFormErrors,
  DepositFormState,
  DepositFormWarnings,
  TierInput,
} from "@/components/dashboard/types";
import {
  convertEndDateToTermMonths,
  convertTermMonthsToEndDate,
  decimalToPercentString,
  ensureFinalUnlimitedTier,
  formatCurrencyInput,
  labelToMonthYear,
  normalizeNumericInput,
  percentToDecimalString,
  productTypeLabel,
  unformatCurrencyInput,
} from "@/components/dashboard/utils";

function RequiredIndicator() {
  return (
    <>
      <span className="text-danger-fg" aria-hidden>
        *
      </span>
      <span className="sr-only"> required</span>
    </>
  );
}

type Step2DetailsProps = {
  form: DepositFormState;
  errors: DepositFormErrors;
  warnings: DepositFormWarnings;
  onUpdate: (partial: Partial<DepositFormState>) => void;
  onFieldBlur: (field: keyof DepositFormErrors) => void;
  onGoToStep1: () => void;
};

export default function Step2Details({
  form,
  errors,
  warnings,
  onUpdate,
  onFieldBlur,
  onGoToStep1,
}: Step2DetailsProps) {
  const showOpenEndedToggle = form.productType === "savings";
  const showTermFields = form.productType !== "savings" || !form.isOpenEnded;
  const showPayoutFrequency = form.productType !== "savings";

  return (
    <section className="space-y-5" aria-label="Step 2 Investment Details">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Step 2 - Investment Details</h3>
          <p className="text-muted-foreground text-xs">Only relevant fields are shown.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onGoToStep1}>
          Change
        </Button>
      </div>

      {/* Step 1 summary */}
      <div className="border-border bg-surface-soft space-y-2 rounded-md border p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Bank</span>
          <span className="font-medium">{form.bankName || "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Product</span>
          <span className="font-medium">{productTypeLabel(form.productType) || "-"}</span>
        </div>
      </div>

      {/* Investment name */}
      <div className="space-y-2 text-sm">
        <Label htmlFor="name">
          Investment name <RequiredIndicator />
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          onBlur={() => onFieldBlur("name")}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "error-name" : undefined}
        />
        <p id="error-name" className="text-danger-fg min-h-5 text-xs">
          {errors.name ?? ""}
        </p>
      </div>

      {/* Principal */}
      <div className="space-y-2 text-sm">
        <Label htmlFor="principal">
          Principal amount <RequiredIndicator />
        </Label>
        <Input
          id="principal"
          inputMode="decimal"
          value={form.principal}
          onFocus={() => onUpdate({ principal: unformatCurrencyInput(form.principal) })}
          onChange={(event) =>
            onUpdate({
              principal: normalizeNumericInput(
                unformatCurrencyInput(event.target.value),
                2,
              ),
            })
          }
          onBlur={() => {
            onUpdate({
              principal: formatCurrencyInput(unformatCurrencyInput(form.principal)),
            });
            onFieldBlur("principal");
          }}
          aria-invalid={Boolean(errors.principal)}
          aria-describedby={errors.principal ? "error-principal" : undefined}
        />
        <p id="error-principal" className="text-danger-fg min-h-5 text-xs">
          {errors.principal ?? ""}
        </p>
      </div>

      {/* Start date */}
      <div className="space-y-2 text-sm">
        <Label htmlFor="startDate">
          Start date <RequiredIndicator />
        </Label>
        <DatePicker
          id="startDate"
          value={form.startDate}
          onChange={(value) => {
            onUpdate({
              startDate: value,
              endDate:
                form.termInputMode === "months"
                  ? convertTermMonthsToEndDate(value, form.termMonths)
                  : form.endDate,
            });
          }}
          onBlur={() => onFieldBlur("startDate")}
          className={errors.startDate ? "border-danger-border" : undefined}
        />
        <p className="text-danger-fg min-h-5 text-xs">{errors.startDate ?? ""}</p>
        {warnings.startDate ? (
          <p className="text-status-warning-fg text-xs">{warnings.startDate}</p>
        ) : null}
      </div>

      {/* Open-ended toggle (savings only) */}
      {showOpenEndedToggle ? (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={form.isOpenEnded}
            onChange={(event) => onUpdate({ isOpenEnded: event.target.checked })}
          />
          No fixed maturity date
        </label>
      ) : null}

      {/* Term fields */}
      {showTermFields ? (
        <>
          <div className="space-y-2 text-sm">
            <span className="inline-block" id="term-mode">
              Term input mode
            </span>
            <div>
              <ToggleGroup
                type="single"
                value={form.termInputMode}
                aria-labelledby="term-mode"
                onValueChange={(value) => {
                  if (!value) return;
                  if (value === "end-date") {
                    onUpdate({
                      termInputMode: "end-date",
                      endDate: convertTermMonthsToEndDate(
                        form.startDate,
                        form.termMonths,
                      ),
                    });
                    return;
                  }
                  onUpdate({
                    termInputMode: "months",
                    termMonths: convertEndDateToTermMonths(form.startDate, form.endDate),
                  });
                }}
              >
                <ToggleGroupItem value="months">Months</ToggleGroupItem>
                <ToggleGroupItem value="end-date">Pick end date</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {form.termInputMode === "months" ? (
            <div className="space-y-2 text-sm">
              <Label className="inline-block" htmlFor="termMonths">
                Term (months) <RequiredIndicator />
              </Label>
              <Input
                id="termMonths"
                inputMode="decimal"
                value={form.termMonths}
                onChange={(event) => {
                  const nextTerm = normalizeNumericInput(event.target.value, 2);
                  onUpdate({
                    termMonths: nextTerm,
                    endDate: convertTermMonthsToEndDate(form.startDate, nextTerm),
                  });
                }}
                onBlur={() => onFieldBlur("termMonths")}
                aria-invalid={Boolean(errors.termMonths)}
                aria-describedby={errors.termMonths ? "error-term" : undefined}
              />
              <div className="flex flex-wrap gap-2">
                {[1, 3, 6, 12, 24].map((months) => (
                  <Button
                    key={months}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const nextMonths = String(months);
                      onUpdate({
                        termMonths: nextMonths,
                        endDate: convertTermMonthsToEndDate(form.startDate, nextMonths),
                      });
                    }}
                  >
                    {months}M
                  </Button>
                ))}
              </div>
              <p id="error-term" className="text-danger-fg min-h-5 text-xs">
                {errors.termMonths ?? ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <Label htmlFor="endDate">
                End date <RequiredIndicator />
              </Label>
              <DatePicker
                id="endDate"
                value={form.endDate}
                onChange={(value) => {
                  onUpdate({
                    endDate: value,
                    termMonths: convertEndDateToTermMonths(form.startDate, value),
                  });
                }}
                onBlur={() => onFieldBlur("endDate")}
                className={errors.endDate ? "border-danger-border" : undefined}
              />
              <p className="text-danger-fg min-h-5 text-xs">{errors.endDate ?? ""}</p>
            </div>
          )}
        </>
      ) : null}

      {/* Interest rate group */}
      <div className="border-border bg-surface-soft space-y-3 rounded-md border p-3 text-sm">
        <Label className="block text-sm font-semibold">Interest Rate</Label>

        {!form.tieredEnabled ? (
          <>
            <Label htmlFor="rate" className="block">
              Annual interest rate <RequiredIndicator />
            </Label>
            <div className="relative">
              <Input
                id="rate"
                inputMode="decimal"
                value={decimalToPercentString(form.rate)}
                onChange={(event) => {
                  const normalizedPercent = normalizeNumericInput(event.target.value, 6);
                  onUpdate({ rate: percentToDecimalString(normalizedPercent) });
                }}
                onBlur={() => onFieldBlur("rate")}
                aria-invalid={Boolean(errors.rate)}
                aria-describedby={errors.rate ? "error-rate" : "rate-help"}
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                %
              </span>
            </div>
            <p id="rate-help" className="text-muted-foreground text-xs">
              Starting point only — verify with your bank
              {form.lastUpdated
                ? ` · Last updated ${labelToMonthYear(form.lastUpdated)}`
                : ""}
            </p>
            {form.notes ? (
              <p className="text-muted-foreground text-xs">{form.notes}</p>
            ) : null}
            {warnings.rate ? (
              <p className="text-status-warning-fg text-xs">{warnings.rate}</p>
            ) : null}
            <p id="error-rate" className="text-danger-fg min-h-5 text-xs">
              {errors.rate ?? ""}
            </p>
          </>
        ) : (
          <TierBuilder
            tiers={form.tiers}
            errors={errors}
            warnings={warnings.tiers}
            onTiersChange={(tiers: TierInput[]) => onUpdate({ tiers })}
          />
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-primary"
            checked={form.tieredEnabled}
            onChange={(event) => {
              if (event.target.checked) {
                const next = ensureFinalUnlimitedTier(form.tiers);
                next[0] = { ...next[0], rate: form.rate || next[0]?.rate || "" };
                onUpdate({ tieredEnabled: true, tiers: next });
                return;
              }
              const firstTierRate =
                ensureFinalUnlimitedTier(form.tiers)[0]?.rate || form.rate;
              onUpdate({ tieredEnabled: false, rate: firstTierRate });
            }}
          />
          This account uses tiered rates
        </label>
      </div>

      {/* Payout frequency */}
      {showPayoutFrequency ? (
        <div className="space-y-2 text-sm">
          <Label id="payout-label">Payout frequency</Label>
          <ToggleGroup
            type="single"
            value={form.payoutFrequency}
            aria-labelledby="payout-label"
            onValueChange={(value) => {
              if (!value) return;
              onUpdate({ payoutFrequency: value as "monthly" | "maturity" });
            }}
          >
            <ToggleGroupItem value="maturity">At maturity</ToggleGroupItem>
            <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : null}

      {/* Compounding */}
      <fieldset className="space-y-2 text-sm">
        <Label id="compounding" className="block">
          Compounding
        </Label>
        <ToggleGroup
          type="single"
          value={form.compounding}
          aria-labelledby="compounding"
          onValueChange={(value) => {
            if (!value) return;
            onUpdate({ compounding: value as "daily" | "monthly" });
          }}
        >
          <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
        </ToggleGroup>
      </fieldset>

      {/* Withholding tax */}
      <div className="space-y-2 text-sm">
        <Label htmlFor="taxRate">Withholding tax (%)</Label>
        <div className="relative">
          <Input
            id="taxRate"
            inputMode="decimal"
            value={decimalToPercentString(form.taxRate)}
            onChange={(event) => {
              const normalizedPercent = normalizeNumericInput(event.target.value, 6);
              onUpdate({ taxRate: percentToDecimalString(normalizedPercent) });
            }}
            onBlur={() => onFieldBlur("taxRate")}
            aria-invalid={Boolean(errors.taxRate)}
            aria-describedby={errors.taxRate ? "error-tax" : "tax-help"}
          />
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            %
          </span>
        </div>
        <p id="tax-help" className="text-muted-foreground text-xs">
          Standard PH rate is 20%
        </p>
        <p id="error-tax" className="text-danger-fg min-h-5 text-xs">
          {errors.taxRate ?? ""}
        </p>
      </div>
    </section>
  );
}
