"use client";

import { Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useCurrencyInput } from "@/components/ui/use-currency-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CURRENCY_SYMBOL } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { InterestTier } from "@/types";
import type {
  WizardFormState,
  FieldErrors,
  FieldWarnings,
  ProductType,
} from "@/features/dashboard/hooks/useWizardState";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvestmentFormProps {
  formState: WizardFormState;
  errors: FieldErrors;
  warnings: FieldWarnings;
  setField: <K extends keyof WizardFormState>(key: K, value: WizardFormState[K]) => void;
  touchField: (key: keyof WizardFormState) => void;
  existingBankNames: string[];
  timeZone?: string
}

// ─── Product type cards ───────────────────────────────────────────────────────

const PRODUCT_TYPES: { value: ProductType; label: string; description: string }[] = [
  {
    value: "td-maturity",
    label: "Time Deposit",
    description: "Fixed term · Principal + interest returned at maturity",
  },
  {
    value: "td-monthly",
    label: "TD Monthly Payout",
    description: "Fixed term · Interest paid to you monthly",
  },
  {
    value: "savings",
    label: "Savings",
    description: "No maturity date · Earns interest until you withdraw",
  },
];

// ─── Tier builder ─────────────────────────────────────────────────────────────

/** Isolated component so useCurrencyInput is called at the component level,
 *  not inside a map() loop. */
function TierUpToInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (raw: string) => void;
}) {
  const currencyProps = useCurrencyInput({ value, onChange });
  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{CURRENCY_SYMBOL}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="500,000" {...currencyProps} />
    </InputGroup>
  );
}

function TierBuilder({
  tiers,
  onChange,
}: {
  tiers: InterestTier[];
  onChange: (tiers: InterestTier[]) => void;
}) {
  const handleRateChange = (index: number, raw: string) => {
    const rate = parseFloat(raw);
    onChange(
      tiers.map((t, i) => (i === index ? { ...t, rate: isNaN(rate) ? 0 : rate / 100 } : t)),
    );
  };

  const handleUpToChange = (index: number, raw: string) => {
    const val = raw === "" ? null : parseFloat(raw);
    onChange(tiers.map((t, i) => (i === index ? { ...t, upTo: val } : t)));
  };

  const handleAdd = () => {
    const lastRate = tiers[tiers.length - 1]?.rate ?? 0;
    const newTiers = [...tiers];
    newTiers.splice(newTiers.length - 1, 0, { upTo: 0, rate: lastRate });
    onChange(newTiers);
  };

  const handleDelete = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
        <span className="text-xs text-muted-foreground">Balance up to</span>
        <span className="text-xs text-muted-foreground">Annual rate</span>
        <span className="w-7" />
      </div>

      {tiers.map((tier, index) => {
        const isLast = index === tiers.length - 1;
        const rateDisplay = tier.rate > 0 ? String(+(tier.rate * 100).toFixed(4)) : "";

        return (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            {isLast ? (
              <div className="flex h-8 items-center rounded-lg border bg-muted/40 px-3">
                <span className="text-xs text-muted-foreground">and above</span>
              </div>
            ) : (
              <TierUpToInput
                value={tier.upTo !== null ? String(tier.upTo) : ""}
                onChange={(raw) => handleUpToChange(index, raw)}
              />
            )}

            <InputGroup>
              <InputGroupInput
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="6.5"
                value={rateDisplay}
                onChange={(e) => handleRateChange(index, e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>%</InputGroupText>
              </InputGroupAddon>
            </InputGroup>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(index)}
              disabled={isLast && tiers.length === 1}
              aria-label="Remove tier"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="w-full">
        + Add tier
      </Button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Req() {
  return (
    <span aria-hidden="true" className="text-destructive ml-0.5">
      *
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TERM_PRESETS = [3, 6, 9, 12, 18, 24] as const;
const DATALIST_ID = "bank-name-suggestions";

export function InvestmentForm({
  formState,
  errors,
  warnings,
  setField,
  touchField,
  existingBankNames,
  timeZone,
}: InvestmentFormProps) {
  const principalCurrencyProps = useCurrencyInput({
    value: formState.principal,
    onChange: (raw) => setField("principal", raw),
    onBlur: () => touchField("principal"),
  });

  const isFixedTerm =
    formState.productType === "td-maturity" || formState.productType === "td-monthly";
  const isSavings = formState.productType === "savings";

  const startDateObj = formState.startDate
    ? new Date(formState.startDate + "T00:00:00")
    : undefined;

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) setField("startDate", date.toISOString().split("T")[0]);
  };

  const termPresetValue = TERM_PRESETS.includes(
    formState.termMonths as (typeof TERM_PRESETS)[number],
  )
    ? String(formState.termMonths)
    : "";

  return (
    <div className="space-y-8">
      {/* Bank */}
      <Field>
        <FieldLabel htmlFor="inv-bank">
          Bank <Req />
        </FieldLabel>
        <Input
          id="inv-bank"
          list={DATALIST_ID}
          value={formState.bankName}
          onChange={(e) => setField("bankName", e.target.value)}
          onBlur={() => touchField("bankName")}
          placeholder="e.g. Tonik, CIMB, Maya"
          autoComplete="off"
          aria-invalid={!!errors.bankName}
        />
        {existingBankNames.length > 0 && (
          <datalist id={DATALIST_ID}>
            {existingBankNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        )}
        {errors.bankName && <FieldError>{errors.bankName}</FieldError>}
      </Field>

      {/* Product type */}
      <Field>
        <FieldLabel>
          Product type <Req />
        </FieldLabel>
        <RadioGroup
          value={formState.productType}
          onValueChange={(val) => setField("productType", val as ProductType)}
          className="gap-2"
        >
          {PRODUCT_TYPES.map(({ value, label, description }) => (
            <label
              key={value}
              htmlFor={`product-${value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent-hover-bg/50",
                formState.productType === value
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <RadioGroupItem id={`product-${value}`} value={value} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </Field>

      {/* Name */}
      <Field>
        <FieldLabel htmlFor="inv-name">Name</FieldLabel>
        <Input
          id="inv-name"
          value={formState.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder={formState.bankName ? `${formState.bankName} deposit` : "Investment name"}
        />
        <FieldDescription>How this investment appears in your portfolio</FieldDescription>
      </Field>

      {/* Principal */}
      <Field>
        <FieldLabel htmlFor="inv-principal">
          Principal <Req />
        </FieldLabel>
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>{CURRENCY_SYMBOL}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="inv-principal"
            placeholder="100,000"
            aria-invalid={!!errors.principal}
            {...principalCurrencyProps}
          />
        </InputGroup>
        {errors.principal && <FieldError>{errors.principal}</FieldError>}
      </Field>

      {/* Start date */}
      <Field>
        <FieldLabel htmlFor="inv-start-date">Start date</FieldLabel>
        <DatePicker
          id="inv-start-date"
          selected={startDateObj}
          timeZone={timeZone}
          onSelect={handleStartDateSelect}
        />
      </Field>

      {/* Rate + Tiered toggle */}
      <div className="space-y-2">
        {/* Label row — toggle always aligned to the label, never to a description */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">
            Interest rate <Req />
          </span>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="tiered-toggle"
              className="text-xs text-muted-foreground whitespace-nowrap"
            >
              Tiered rates
            </Label>
            <Switch
              id="tiered-toggle"
              checked={formState.interestMode === "tiered"}
              onCheckedChange={(checked) =>
                setField("interestMode", checked ? "tiered" : "simple")
              }
            />
          </div>
        </div>

        {formState.interestMode === "simple" ? (
          <div className="space-y-1.5">
            <InputGroup>
              <InputGroupInput
                id="inv-rate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="6.5"
                value={formState.flatRate}
                onChange={(e) => setField("flatRate", e.target.value)}
                onBlur={() => touchField("flatRate")}
                aria-invalid={!!errors.flatRate}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>%</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            { errors.flatRate && <FieldError>{errors.flatRate}</FieldError> }
            { warnings.flatRate && <p className="text-xs text-status-warning-fg">{warnings.flatRate}</p> }
            <FieldDescription>Annual interest rate (p.a.)</FieldDescription>
          </div>
        ) : (
          <div className="space-y-1.5">
            <TierBuilder
              tiers={formState.tiers}
              onChange={(tiers) => setField("tiers", tiers)}
            />
            <FieldDescription>
              Different rates apply to different balance brackets
            </FieldDescription>
          </div>
        )}
      </div>

      {/* Tax rate */}
      <Field>
        <FieldLabel htmlFor="inv-tax">
          Withholding tax <Req />
        </FieldLabel>
        <InputGroup className="w-28">
          <InputGroupInput
            id="inv-tax"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={formState.taxRate}
            onChange={(e) => setField("taxRate", e.target.value)}
            onBlur={() => touchField("taxRate")}
            aria-invalid={!!errors.taxRate}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>%</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        {errors.taxRate && <FieldError>{errors.taxRate}</FieldError> }
        <FieldDescription>
          Withholding tax deducted by the bank before you receive interest
        </FieldDescription>
      </Field>

      {/* Day-count convention */}
      <Field>
        <FieldLabel>Day count</FieldLabel>
        <ToggleGroup
          type="single"
          variant="card"
          value={String(formState.dayCountConvention)}
          onValueChange={(val) => {
            if (val) setField("dayCountConvention", parseInt(val) as 360 | 365);
          }}
        >
          <ToggleGroupItem value="365">365</ToggleGroupItem>
          <ToggleGroupItem value="360">360</ToggleGroupItem>
        </ToggleGroup>
        <FieldDescription>
          Days used to calculate daily interest. Most banks use 365; check your term sheet.
        </FieldDescription>
      </Field>

      {/* Compounding — always shown */}
      <Field>
        <FieldLabel>Compounding</FieldLabel>
        <ToggleGroup
          type="single"
          variant="card"
          value={formState.compounding}
          onValueChange={(val) => {
            if (val) setField("compounding", val as "daily" | "monthly");
          }}
        >
          <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
        </ToggleGroup>
        <FieldDescription>
          How often interest is added back to your balance — daily grows slightly faster
        </FieldDescription>
      </Field>

      {/* ── Fixed-term fields ───────────────────────────────── */}
      {isFixedTerm && (
        <>
          <Field>
            <FieldLabel>
              Term <Req />
            </FieldLabel>
            <div className="space-y-2">
              <ToggleGroup
                type="single"
                variant="card"
                value={termPresetValue}
                onValueChange={(val) => {
                  if (val) setField("termMonths", parseInt(val));
                }}
              >
                {TERM_PRESETS.map((m) => (
                  <ToggleGroupItem key={m} value={String(m)}>
                    {m} mo
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <InputGroup className="w-28">
                <InputGroupInput
                  type="number"
                  min={1}
                  max={360}
                  placeholder="Custom"
                  value={
                    formState.termMonths !== null &&
                    !TERM_PRESETS.includes(
                      formState.termMonths as (typeof TERM_PRESETS)[number],
                    )
                      ? String(formState.termMonths)
                      : ""
                  }
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) setField("termMonths", val);
                  }}
                  onBlur={() => touchField("termMonths")}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>mo</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
            {errors.termMonths && (
              <FieldError>{errors.termMonths}</FieldError>
            )}
            <FieldDescription>How long your money is locked in</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Payout frequency</FieldLabel>
            <ToggleGroup
              type="single"
              variant="card"
              value={formState.payoutFrequency}
              onValueChange={(val) => {
                if (val) setField("payoutFrequency", val as "monthly" | "maturity");
              }}
            >
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="maturity">At maturity</ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              Monthly = interest paid periodically; At maturity = everything at the end
            </FieldDescription>
          </Field>
        </>
      )}

      {/* ── Savings fields ──────────────────────────────────── */}
      {isSavings && (
        <>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="open-ended-toggle" className="text-sm font-medium">
                Open-ended
              </Label>
              <p className="text-xs text-muted-foreground">
                No fixed maturity date — earns interest until you choose to withdraw
              </p>
            </div>
            <Switch
              id="open-ended-toggle"
              checked={formState.isOpenEnded}
              onCheckedChange={(checked) => setField("isOpenEnded", checked)}
            />
          </div>

          {!formState.isOpenEnded && (
            <Field>
              <FieldLabel>
                Term <Req />
              </FieldLabel>
              <div className="space-y-2">
                <ToggleGroup
                  type="single"
                  variant="card"
                  value={termPresetValue}
                  onValueChange={(val) => {
                    if (val) setField("termMonths", parseInt(val));
                  }}
                >
                  {TERM_PRESETS.map((m) => (
                    <ToggleGroupItem key={m} value={String(m)}>
                      {m} mo
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <InputGroup className="w-28">
                  <InputGroupInput
                    type="number"
                    min={1}
                    placeholder="Custom"
                    value={
                      formState.termMonths !== null &&
                      !TERM_PRESETS.includes(
                        formState.termMonths as (typeof TERM_PRESETS)[number],
                      )
                        ? String(formState.termMonths)
                        : ""
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) setField("termMonths", val);
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>mo</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <FieldDescription>How long your money is locked in</FieldDescription>
            </Field>
          )}
        </>
      )}
    </div>
  );
}
