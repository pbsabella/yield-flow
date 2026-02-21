"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Landmark,
  LineChart,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import DatePicker from "@/components/dashboard/DatePicker";
import type { Bank, TimeDeposit } from "@/lib/types";
import { buildDepositSummary } from "@/lib/domain/interest";
import { formatDate } from "@/lib/domain/date";
import type { DepositFormErrors, DepositFormState } from "@/components/dashboard/types";
import {
  decimalToPercentString,
  percentToDecimalString,
  toNumber,
  validateDeposit,
} from "@/components/dashboard/utils";

const currency = "PHP";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function toBankId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  title: string;
  banks: Bank[];
  form: DepositFormState;
  errors: DepositFormErrors;
  onValidate: (next: DepositFormErrors) => void;
  onSubmit: (nextForm: DepositFormState) => void;
  onReset: () => void;
};

const percentInputClass =
  "h-12 w-full rounded-lg border border-border bg-card px-4 py-3 pr-8 text-sm";

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debouncedValue;
}

export default function DepositFormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  banks,
  form,
  errors,
  onValidate,
  onSubmit,
  onReset,
}: Props) {
  const [draftForm, setDraftForm] = useState<DepositFormState>(form);
  const debouncedForm = useDebouncedValue(draftForm, 300);
  const isSaveDisabled =
    !draftForm.bankName.trim() ||
    !draftForm.name.trim() ||
    !draftForm.startDate ||
    toNumber(draftForm.principal) <= 0 ||
    toNumber(draftForm.termMonths) <= 0 ||
    toNumber(draftForm.taxRate) < 0 ||
    toNumber(draftForm.taxRate) > 1 ||
    (draftForm.interestMode === "simple"
      ? toNumber(draftForm.flatRate) <= 0
      : toNumber(draftForm.tier1Rate) <= 0 || toNumber(draftForm.tier2Rate) <= 0);

  const previewSummary = useMemo(() => {
    const previewDeposit: TimeDeposit = {
      id: "preview",
      bankId: debouncedForm.bankId,
      name: debouncedForm.name || "New investment",
      principal: toNumber(debouncedForm.principal),
      startDate: debouncedForm.startDate || "1970-01-01",
      termMonths: Math.max(1, toNumber(debouncedForm.termMonths)),
      interestMode: debouncedForm.interestMode,
      flatRate: toNumber(debouncedForm.flatRate),
      compounding: debouncedForm.compounding,
      taxRateOverride: toNumber(debouncedForm.taxRate),
      tiers: [
        {
          upTo: toNumber(debouncedForm.tier1Cap) || null,
          rate: toNumber(debouncedForm.tier1Rate),
        },
        {
          upTo: null,
          rate: toNumber(debouncedForm.tier2Rate) || toNumber(debouncedForm.tier1Rate),
        },
      ],
      payoutFrequency: debouncedForm.payoutFrequency,
    };

    return buildDepositSummary(
      previewDeposit,
      banks.find((bank) => bank.id === debouncedForm.bankId) ?? banks[0],
    );
  }, [banks, debouncedForm]);

  const [bankOpen, setBankOpen] = useState(false);
  const [bankActiveIndex, setBankActiveIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const bankQuery = draftForm.bankName;
  const normalizedQuery = bankQuery.trim().toLowerCase();
  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(normalizedQuery),
  );
  const hasExactMatch = banks.some((bank) => bank.name.toLowerCase() === normalizedQuery);
  const canCreate = normalizedQuery.length > 0 && !hasExactMatch;
  const options = [
    ...filteredBanks.map((bank) => ({
      id: bank.id,
      label: bank.name,
      isCreate: false,
    })),
    ...(canCreate ? [{ id: "__create__", label: bankQuery.trim(), isCreate: true }] : []),
  ];

  const safeBankActiveIndex =
    options.length === 0 ? 0 : Math.min(bankActiveIndex, options.length - 1);

  useEffect(() => {
    const node = optionRefs.current[safeBankActiveIndex];
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [safeBankActiveIndex]);

  useEffect(() => {
    if (open) return;
    onValidate({});
  }, [open, onValidate]);

  function updateFieldError(field: keyof DepositFormErrors, nextForm: DepositFormState) {
    const nextErrors = validateDeposit(nextForm);
    const merged: DepositFormErrors = { ...errors };
    if (nextErrors[field]) {
      merged[field] = nextErrors[field];
    } else {
      delete merged[field];
    }
    onValidate(merged);
  }

  const FormFields = (
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="text-secondary flex items-center gap-2 text-sm font-semibold">
          <Landmark className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          The Asset
        </div>
        <div className="grid gap-6">
          <div className="space-y-3 text-sm">
            <Label htmlFor="bank">
              Bank <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <div className="relative">
              <Input
                id="bank"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={bankOpen}
                aria-controls="bank-options"
                aria-activedescendant={
                  bankOpen && options.length > 0
                    ? `bank-option-${safeBankActiveIndex}`
                    : undefined
                }
                aria-invalid={Boolean(errors.bankName)}
                aria-describedby={errors.bankName ? "error-bank" : undefined}
                value={bankQuery}
                onChange={(event) => {
                  const next = event.target.value;
                  setBankActiveIndex(0);
                  const nextForm = {
                    ...draftForm,
                    bankName: next,
                    bankId: toBankId(next),
                  };
                  setDraftForm(nextForm);
                  if (!bankOpen) setBankOpen(true);
                }}
                onFocus={() => {
                  setBankOpen(true);
                  setBankActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Tab") {
                    setBankOpen(false);
                    return;
                  }
                  if (event.key === "Escape") {
                    setBankOpen(false);
                    return;
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    if (!bankOpen) setBankOpen(true);
                    setBankActiveIndex(0);
                    requestAnimationFrame(() => {
                      optionRefs.current[0]?.focus();
                    });
                    return;
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    if (!bankOpen) setBankOpen(true);
                    const lastIndex = Math.max(options.length - 1, 0);
                    setBankActiveIndex(lastIndex);
                    requestAnimationFrame(() => {
                      optionRefs.current[lastIndex]?.focus();
                    });
                    return;
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    if (!bankOpen) setBankOpen(true);
                    setBankActiveIndex((current) => {
                      const next = Math.min(Math.max(current, 0) + 1, options.length - 1);
                      requestAnimationFrame(() => {
                        optionRefs.current[next]?.focus();
                      });
                      return next;
                    });
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!bankOpen) setBankOpen(true);
                    setBankActiveIndex((current) => {
                      const next = Math.max(Math.max(current, 0) - 1, 0);
                      requestAnimationFrame(() => {
                        optionRefs.current[next]?.focus();
                      });
                      return next;
                    });
                    return;
                  }
                  if (event.key === "Enter" && options.length > 0) {
                    event.preventDefault();
                    const selected = options[safeBankActiveIndex];
                    if (!selected) return;
                    if (selected.isCreate) {
                      const name = selected.label;
                      setDraftForm({
                        ...draftForm,
                        bankName: name,
                        bankId: toBankId(name),
                      });
                    } else {
                      setDraftForm({
                        ...draftForm,
                        bankName: selected.label,
                        bankId: selected.id,
                      });
                    }
                    setBankOpen(false);
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    const next = document.activeElement;
                    if (next && listboxRef.current?.contains(next)) return;
                    setBankOpen(false);
                  }, 120);
                  updateFieldError("bankName", draftForm);
                }}
                placeholder="Search or type a bank name"
              />
              <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                ▼
              </span>
              {bankOpen ? (
                <div
                  id="bank-options"
                  role="listbox"
                  ref={listboxRef}
                  className="border-subtle bg-surface text-primary absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border p-2 shadow-sm"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {options.length === 0 ? (
                    <p className="text-muted px-2 py-1 text-xs">No matches.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {options.map((option, index) => (
                        <button
                          key={option.id}
                          type="button"
                          role="option"
                          tabIndex={safeBankActiveIndex === index ? 0 : -1}
                          id={`bank-option-${index}`}
                          aria-selected={safeBankActiveIndex === index}
                          ref={(node) => {
                            optionRefs.current[index] = node;
                          }}
                          className={`focus-visible:ring-primary/60 active:bg-muted/80 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2 ${
                            safeBankActiveIndex === index
                              ? "bg-muted/70 text-foreground"
                              : "hover:bg-muted/70"
                          }`}
                          onKeyDown={(event) => {
                            if (event.key === "Tab") {
                              setBankOpen(false);
                              return;
                            }
                            if (event.key === "Escape") {
                              setBankOpen(false);
                              return;
                            }
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              const next = Math.min(index + 1, options.length - 1);
                              setBankActiveIndex(next);
                              optionRefs.current[next]?.focus();
                              return;
                            }
                            if (event.key === "ArrowUp") {
                              event.preventDefault();
                              const next = Math.max(index - 1, 0);
                              setBankActiveIndex(next);
                              optionRefs.current[next]?.focus();
                            }
                          }}
                          onClick={() => {
                            if (option.isCreate) {
                              const name = option.label;
                              setDraftForm({
                                ...draftForm,
                                bankName: name,
                                bankId: toBankId(name),
                              });
                            } else {
                              setDraftForm({
                                ...draftForm,
                                bankName: option.label,
                                bankId: option.id,
                              });
                            }
                            setBankOpen(false);
                          }}
                        >
                          {option.isCreate ? `Create "${option.label}"` : option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {errors.bankName ? (
              <p id="error-bank" className="text-xs text-rose-600 dark:text-rose-300">
                {errors.bankName}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 text-sm">
            <Label htmlFor="name">
              Investment name <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <Input
              id="name"
              placeholder="6M Flex"
              value={draftForm.name}
              onChange={(event) => {
                const nextForm = { ...draftForm, name: event.target.value };
                setDraftForm(nextForm);
              }}
              onBlur={() => updateFieldError("name", draftForm)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "error-name" : undefined}
            />
            {errors.name ? (
              <p id="error-name" className="text-xs text-rose-600 dark:text-rose-300">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 text-sm">
            <Label htmlFor="principal">
              Principal <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <div className="relative">
              <span className="text-muted absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                {currency}
              </span>
              <Input
                id="principal"
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                className="pl-12"
                placeholder="1500000"
                value={draftForm.principal}
                onChange={(event) => {
                  const nextForm = { ...draftForm, principal: event.target.value };
                  setDraftForm(nextForm);
                }}
                onBlur={() => updateFieldError("principal", draftForm)}
                aria-invalid={Boolean(errors.principal)}
                aria-describedby={errors.principal ? "error-principal" : undefined}
              />
            </div>
            {errors.principal ? (
              <p
                id="error-principal"
                className="text-xs text-rose-600 dark:text-rose-300"
              >
                {errors.principal}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="text-secondary flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
          Accrual & Payout
        </div>
        <div className="grid gap-6">
          <div className="space-y-3 text-sm">
            <Label id="calc-mode-label" className="block">
              Calculation mode <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="calc-mode-label"
              value={draftForm.interestMode}
              onValueChange={(value) => {
                if (!value) return;
                setDraftForm({
                  ...draftForm,
                  interestMode: value as DepositFormState["interestMode"],
                });
              }}
            >
              <ToggleGroupItem value="simple">Fixed</ToggleGroupItem>
              <ToggleGroupItem value="tiered">Tiered</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted text-xs">
              Fixed uses one rate. Tiered splits at the threshold.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <Label id="term-type-label" className="block">
              Term type <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="term-type-label"
              value={draftForm.termType}
              onValueChange={(value) => {
                if (!value) return;
                const nextForm: DepositFormState = {
                  ...draftForm,
                  termType: value as DepositFormState["termType"],
                  payoutFrequency:
                    value === "open" ? "monthly" : draftForm.payoutFrequency,
                  interestTreatment:
                    value === "open" ? "payout" : draftForm.interestTreatment,
                  tenurePreset: value === "open" ? "open" : draftForm.tenurePreset,
                  termMonths: value === "open" ? "12" : draftForm.termMonths,
                };
                setDraftForm(nextForm);
              }}
            >
              <ToggleGroupItem value="fixed">Fixed term</ToggleGroupItem>
              <ToggleGroupItem value="open">Open-ended</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted text-xs">
              Open-ended uses a rolling 12-month projection for forecasts.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <Label id="tenure-label" className="block">
              Tenure <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="tenure-label"
              value={draftForm.tenurePreset}
              onValueChange={(value) => {
                if (!value) return;
                const preset = value as DepositFormState["tenurePreset"];
                const presetMonths =
                  preset === "30d"
                    ? "1"
                    : preset === "60d"
                      ? "2"
                      : preset === "90d"
                        ? "3"
                        : preset === "1y"
                          ? "12"
                          : draftForm.termMonths;
                const nextForm: DepositFormState = {
                  ...draftForm,
                  tenurePreset: preset,
                  termMonths: preset === "custom" ? draftForm.termMonths : presetMonths,
                };
                setDraftForm(nextForm);
              }}
              disabled={draftForm.termType === "open"}
            >
              <ToggleGroupItem value="30d">30d</ToggleGroupItem>
              <ToggleGroupItem value="60d">60d</ToggleGroupItem>
              <ToggleGroupItem value="90d">90d</ToggleGroupItem>
              <ToggleGroupItem value="1y">1y</ToggleGroupItem>
              <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
            </ToggleGroup>
            {draftForm.tenurePreset === "custom" ? (
              <div className="mt-3 space-y-2 text-sm">
                <Label htmlFor="customTenure">
                  Custom tenure (months){" "}
                  <span className="text-rose-600 dark:text-rose-300">*</span>
                </Label>
                <Input
                  id="customTenure"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  value={draftForm.termMonths}
                  onChange={(event) => {
                    const nextForm: DepositFormState = {
                      ...draftForm,
                      termMonths: event.target.value,
                      tenurePreset: "custom",
                    };
                    setDraftForm(nextForm);
                  }}
                  onBlur={() => updateFieldError("termMonths", draftForm)}
                  aria-invalid={Boolean(errors.termMonths)}
                  aria-describedby={errors.termMonths ? "error-term" : undefined}
                  placeholder="Months"
                  disabled={draftForm.termType === "open"}
                />
              </div>
            ) : null}
            {errors.termMonths ? (
              <p id="error-term" className="text-xs text-rose-600 dark:text-rose-300">
                {errors.termMonths}
              </p>
            ) : null}
          </div>

          {draftForm.interestMode === "simple" ? (
            <div className="space-y-3 text-sm">
              <Label htmlFor="flatRate">
                Annual rate <span className="text-rose-600 dark:text-rose-300">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="flatRate"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  className={percentInputClass}
                  value={decimalToPercentString(draftForm.flatRate)}
                  onChange={(event) => {
                    const nextForm = {
                      ...draftForm,
                      flatRate: percentToDecimalString(event.target.value),
                    };
                    setDraftForm(nextForm);
                  }}
                  onBlur={() => updateFieldError("flatRate", draftForm)}
                  aria-invalid={Boolean(errors.flatRate)}
                  aria-describedby={errors.flatRate ? "error-flat-rate" : undefined}
                />
                <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                  %
                </span>
              </div>
              {errors.flatRate ? (
                <p
                  id="error-flat-rate"
                  className="text-xs text-rose-600 dark:text-rose-300"
                >
                  {errors.flatRate}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-3 text-sm">
                <Label htmlFor="tier1Rate">
                  Base rate (Tier 1){" "}
                  <span className="text-rose-600 dark:text-rose-300">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="tier1Rate"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    className={percentInputClass}
                    value={decimalToPercentString(draftForm.tier1Rate)}
                    onChange={(event) => {
                      const nextForm = {
                        ...draftForm,
                        tier1Rate: percentToDecimalString(event.target.value),
                      };
                      setDraftForm(nextForm);
                    }}
                    onBlur={() => updateFieldError("tier1Rate", draftForm)}
                    aria-invalid={Boolean(errors.tier1Rate)}
                    aria-describedby={errors.tier1Rate ? "error-tier1-rate" : undefined}
                  />
                  <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                    %
                  </span>
                </div>
                {errors.tier1Rate ? (
                  <p
                    id="error-tier1-rate"
                    className="text-xs text-rose-600 dark:text-rose-300"
                  >
                    {errors.tier1Rate}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 text-sm">
                <Label htmlFor="tier1Cap">Threshold</Label>
                <Input
                  id="tier1Cap"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="0"
                  value={draftForm.tier1Cap}
                  onChange={(event) => {
                    const nextForm = { ...draftForm, tier1Cap: event.target.value };
                    setDraftForm(nextForm);
                  }}
                  onBlur={() => updateFieldError("tier1Rate", draftForm)}
                />
                <p className="text-muted text-xs">Example: 1000000 for MariBank.</p>
              </div>

              <div className="space-y-3 text-sm">
                <Label htmlFor="tier2Rate">
                  Secondary rate (Tier 2){" "}
                  <span className="text-rose-600 dark:text-rose-300">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="tier2Rate"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    className={percentInputClass}
                    value={decimalToPercentString(draftForm.tier2Rate)}
                    onChange={(event) => {
                      const nextForm = {
                        ...draftForm,
                        tier2Rate: percentToDecimalString(event.target.value),
                      };
                      setDraftForm(nextForm);
                    }}
                    onBlur={() => updateFieldError("tier2Rate", draftForm)}
                    aria-invalid={Boolean(errors.tier2Rate)}
                    aria-describedby={errors.tier2Rate ? "error-tier2-rate" : undefined}
                  />
                  <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                    %
                  </span>
                </div>
                {errors.tier2Rate ? (
                  <p
                    id="error-tier2-rate"
                    className="text-xs text-rose-600 dark:text-rose-300"
                  >
                    {errors.tier2Rate}
                  </p>
                ) : null}
              </div>
            </>
          )}

          <div className="space-y-3 text-sm">
            <Label id="accrual-label" className="block">
              Accrual cadence <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="accrual-label"
              value={draftForm.compounding}
              onValueChange={(value) => {
                if (!value) return;
                setDraftForm({
                  ...draftForm,
                  compounding: value as DepositFormState["compounding"],
                });
              }}
            >
              <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted text-xs">
              Accrual affects growth rate, not cashflow timing.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <Label id="payout-label" className="block">
              Cash payout <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="payout-label"
              value={draftForm.payoutFrequency}
              onValueChange={(value) => {
                if (!value) return;
                const next = value as DepositFormState["payoutFrequency"];
                setDraftForm({
                  ...draftForm,
                  payoutFrequency: next,
                  interestTreatment:
                    next === "monthly" ? "payout" : draftForm.interestTreatment,
                });
              }}
              disabled={draftForm.termType === "open"}
            >
              <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
              <ToggleGroupItem value="maturity">At maturity</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted text-xs">Cashflow appears only on payout dates.</p>
          </div>

          <div className="space-y-3 text-sm">
            <Label id="interest-treatment-label" className="block">
              Interest treatment{" "}
              <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <ToggleGroup
              type="single"
              aria-labelledby="interest-treatment-label"
              value={draftForm.interestTreatment}
              onValueChange={(value) => {
                if (!value) return;
                setDraftForm({
                  ...draftForm,
                  interestTreatment: value as DepositFormState["interestTreatment"],
                });
              }}
              disabled={
                draftForm.payoutFrequency === "monthly" || draftForm.termType === "open"
              }
            >
              <ToggleGroupItem value="reinvest">Reinvest (compounding)</ToggleGroupItem>
              <ToggleGroupItem value="payout">Paid out (no compounding)</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-muted text-xs">
              Monthly payout always uses paid-out interest.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="text-secondary flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-amber-500" />
          The Timeline
        </div>
        <div className="grid gap-6">
          <div className="space-y-3 text-sm">
            <Label htmlFor="startDate">
              Start date <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <DatePicker
              id="startDate"
              value={draftForm.startDate}
              onChange={(value) => {
                const nextForm = { ...draftForm, startDate: value };
                setDraftForm(nextForm);
              }}
              onBlur={() => updateFieldError("startDate", draftForm)}
              className={
                errors.startDate ? "border-rose-600 dark:border-rose-400" : undefined
              }
            />
            {errors.startDate ? (
              <p
                id="error-start-date"
                className="text-xs text-rose-600 dark:text-rose-300"
              >
                {errors.startDate}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 text-sm">
            <Label htmlFor="taxRate">
              Withholding tax <span className="text-rose-600 dark:text-rose-300">*</span>
            </Label>
            <div className="relative">
              <Input
                id="taxRate"
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                className={percentInputClass}
                value={decimalToPercentString(draftForm.taxRate)}
                onChange={(event) => {
                  const nextForm = {
                    ...draftForm,
                    taxRate: percentToDecimalString(event.target.value),
                  };
                  setDraftForm(nextForm);
                }}
                onBlur={() => updateFieldError("taxRate", draftForm)}
                aria-invalid={Boolean(errors.taxRate)}
                aria-describedby={errors.taxRate ? "error-tax-rate" : undefined}
              />
              <span className="text-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                %
              </span>
            </div>
            {errors.taxRate ? (
              <p id="error-tax-rate" className="text-xs text-rose-600 dark:text-rose-300">
                {errors.taxRate}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  const maturityLabel = draftForm.startDate
    ? formatDate(new Date(previewSummary.maturityDate))
    : "Pick a date";

  const LiveResultCard = (
    <aside className="bg-surface sticky top-0 rounded-xl border border-indigo-200 p-5 lg:top-6 dark:border-indigo-500/30">
      <div className="text-secondary flex items-center gap-2 text-sm font-semibold">
        <LineChart className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
        Live Result
      </div>
      <div className="mt-5 space-y-4">
        <div className="border-subtle bg-surface-soft text-muted rounded-lg border px-3 py-2 text-xs">
          Accrues{" "}
          <span className="text-primary font-semibold">{draftForm.compounding}</span>
          {" · "}
          Payout{" "}
          <span className="text-primary font-semibold">{draftForm.payoutFrequency}</span>
          {" · "}
          Treatment{" "}
          <span className="text-primary font-semibold">
            {draftForm.interestTreatment === "reinvest" ? "reinvested" : "paid out"}
          </span>
          . Cashflow shows on payout date.
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">Maturity date</span>
          <span className="font-financial text-foreground font-semibold">
            {maturityLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Gross interest</span>
          <span className="font-financial font-semibold">
            {formatCurrency(previewSummary.grossInterest)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Estimated net interest</span>
          <span className="font-financial inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-400">
            <TrendingUp className="h-4 w-4" />
            {formatCurrency(previewSummary.netInterest)}
          </span>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="hover:bg-muted active:bg-muted flex-1"
          onClick={() => {
            setDraftForm(form);
            onReset();
          }}
        >
          Reset
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-indigo-600 text-white transition-colors duration-150 ease-out hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:text-white/80 disabled:opacity-90"
          disabled={isSaveDisabled}
        >
          Save
        </Button>
      </div>
    </aside>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="top-auto right-0 bottom-0 left-0 max-w-5xl translate-x-0 translate-y-0 rounded-t-2xl p-0 sm:top-8 sm:right-auto sm:bottom-auto sm:left-1/2 sm:my-0 sm:h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] sm:translate-x-[-50%] sm:translate-y-0 sm:overflow-hidden sm:rounded-2xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-subtle border-b px-6 pt-6 pr-12 pb-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Projected net yield updates as you type.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit(draftForm);
              }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="order-last lg:order-first">{FormFields}</div>
              <div className="order-first lg:order-last">{LiveResultCard}</div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
