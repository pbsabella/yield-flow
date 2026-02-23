"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DepositFormErrors, TierInput } from "@/components/dashboard/types";
import {
  decimalToPercentString,
  ensureFinalUnlimitedTier,
  formatCurrencyInput,
  normalizeNumericInput,
  percentToDecimalString,
  toNumber,
  unformatCurrencyInput,
} from "@/components/dashboard/utils";
import { formatPhpCurrency } from "@/lib/domain/format";

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

type TierBuilderProps = {
  tiers: TierInput[];
  errors: DepositFormErrors;
  onTiersChange: (tiers: TierInput[]) => void;
  warnings?: string;
};

export default function TierBuilder({
  tiers,
  errors,
  onTiersChange,
  warnings,
}: TierBuilderProps) {
  const normalized = ensureFinalUnlimitedTier(tiers);

  return (
    <>
      <p className="text-muted-foreground text-xs font-semibold">Tier builder</p>
      {normalized.map((tier, index, arr) => {
        const isLast = index === arr.length - 1;
        const prevTier = arr[index - 1];
        const aboveAmount = prevTier?.upTo
          ? formatPhpCurrency(toNumber(unformatCurrencyInput(prevTier.upTo)))
          : formatPhpCurrency(0);
        const canRemove = arr.length > 1;

        return (
          <div
            key={tier.id}
            className="grid grid-cols-[1.35fr_1fr_auto] items-start gap-2"
          >
            <div>
              <Label
                htmlFor={isLast ? undefined : `tier-up-${tier.id}`}
                className="text-xs"
              >
                Tier ceiling
              </Label>
              {isLast ? (
                <div className="border-border bg-muted text-muted-foreground flex h-12 items-center rounded-md border px-3 text-sm">
                  Above {aboveAmount}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id={`tier-up-${tier.id}`}
                    inputMode="decimal"
                    value={tier.upTo}
                    onFocus={() => {
                      const next = tiers.map((item) =>
                        item.id === tier.id
                          ? { ...item, upTo: unformatCurrencyInput(item.upTo) }
                          : item,
                      );
                      onTiersChange(ensureFinalUnlimitedTier(next));
                    }}
                    onChange={(event) => {
                      const next = tiers.map((item) =>
                        item.id === tier.id
                          ? {
                              ...item,
                              upTo: normalizeNumericInput(
                                unformatCurrencyInput(event.target.value),
                                2,
                              ),
                            }
                          : item,
                      );
                      onTiersChange(ensureFinalUnlimitedTier(next));
                    }}
                    onBlur={() => {
                      const next = tiers.map((item) =>
                        item.id === tier.id
                          ? {
                              ...item,
                              upTo: formatCurrencyInput(unformatCurrencyInput(item.upTo)),
                            }
                          : item,
                      );
                      onTiersChange(ensureFinalUnlimitedTier(next));
                    }}
                    placeholder="Up to ₱"
                  />
                </div>
              )}
              <p className="text-danger-fg min-h-4 text-xs">
                {errors[`tier-${tier.id}-upTo`] ?? ""}
              </p>
            </div>

            <div>
              <Label htmlFor={`tier-rate-${tier.id}`} className="text-xs">
                Tier rate <RequiredIndicator />
              </Label>
              <div className="relative">
                <Input
                  id={`tier-rate-${tier.id}`}
                  inputMode="decimal"
                  value={decimalToPercentString(tier.rate)}
                  onChange={(event) => {
                    const normalizedPercent = normalizeNumericInput(
                      event.target.value,
                      6,
                    );
                    const next = tiers.map((item) =>
                      item.id === tier.id
                        ? { ...item, rate: percentToDecimalString(normalizedPercent) }
                        : item,
                    );
                    onTiersChange(ensureFinalUnlimitedTier(next));
                  }}
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                  %
                </span>
              </div>
              <p className="text-danger-fg min-h-4 text-xs">
                {errors[`tier-${tier.id}-rate`] ?? ""}
              </p>
            </div>

            <div className="pt-1">
              {canRemove ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label="Remove tier"
                  onClick={() => {
                    const next = tiers.filter((item) => item.id !== tier.id);
                    onTiersChange(ensureFinalUnlimitedTier(next));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}

      {warnings ? <p className="text-status-warning-fg text-xs">{warnings}</p> : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const next = ensureFinalUnlimitedTier(tiers);
          next.splice(Math.max(next.length - 1, 0), 0, {
            id: `tier-${crypto.randomUUID()}`,
            upTo: "",
            rate: next[0]?.rate || "",
          });
          onTiersChange(ensureFinalUnlimitedTier(next));
        }}
      >
        <Plus className="h-4 w-4" /> Add tier
      </Button>
    </>
  );
}
