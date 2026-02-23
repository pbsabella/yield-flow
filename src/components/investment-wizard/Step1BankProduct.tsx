"use client";

import { Check } from "lucide-react";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import BankSelector from "./BankSelector";
import type { PendingSelectionChange, ProductOption } from "./useInvestmentWizardState";
import type {
  DepositFormErrors,
  DepositFormState,
  DepositFormWarnings,
  ProductType,
} from "@/components/dashboard/types";
import type { Bank } from "@/lib/types";

const PRODUCT_META: Record<string, { short: string; desc: string }> = {
  "td-maturity": { short: "Time Deposit", desc: "Principal + interest at maturity" },
  "td-monthly": { short: "Monthly Payout", desc: "Interest paid monthly" },
  savings: { short: "Savings Account", desc: "Open-ended, rolling balance" },
};

type Step1BankProductProps = {
  form: DepositFormState;
  errors: DepositFormErrors;
  warnings: DepositFormWarnings;
  banks: Bank[];
  productOptions: ProductOption[];
  pendingSelectionChange: PendingSelectionChange | null;
  onBankSelect: (bankId: string, bankName: string) => void;
  onBankNameChange: (value: string) => void;
  onProductSelect: (productType: ProductType) => void;
  onCustomBankAdd: (bank: Bank) => void;
  onCustomBankCancel: () => void;
  onConfirmSelectionChange: () => void;
  onCancelSelectionChange: () => void;
};

export default function Step1BankProduct({
  form,
  errors,
  warnings,
  banks,
  productOptions,
  pendingSelectionChange,
  onBankSelect,
  onBankNameChange,
  onProductSelect,
  onCustomBankAdd,
  onCustomBankCancel,
  onConfirmSelectionChange,
  onCancelSelectionChange,
}: Step1BankProductProps) {
  const showProductSelector = Boolean(form.bankId);

  return (
    <section className="space-y-6" aria-label="Step 1 Bank and Product">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Bank &amp; Product</h3>
        <p className="text-muted-foreground text-xs">
          Select a bank and product type to continue.
        </p>
      </div>

      {pendingSelectionChange ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{pendingSelectionChange.message}</AlertDescription>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={onConfirmSelectionChange}>
              Confirm change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancelSelectionChange}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      ) : null}

      <BankSelector
        banks={banks}
        bankName={form.bankName}
        selectedBankId={form.bankId}
        errors={errors}
        onBankSelect={onBankSelect}
        onBankNameChange={onBankNameChange}
        onCustomBankAdd={onCustomBankAdd}
        onCustomBankCancel={onCustomBankCancel}
      />

      {showProductSelector ? (
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-[10.5px] font-semibold tracking-wider uppercase">
              Product type{" "}
              <span className="text-danger-fg" aria-hidden>
                *
              </span>
            </p>
            {errors.productType ? (
              <p className="text-danger-fg mt-1 text-xs">{errors.productType}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {productOptions.map((product) => {
              const isSelected = form.productType === product.productType;
              const meta = PRODUCT_META[product.productType] ?? {
                short: product.productType,
                desc: "",
              };
              return (
                <button
                  key={product.productType}
                  type="button"
                  onClick={() => {
                    if (!pendingSelectionChange) onProductSelect(product.productType);
                  }}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "bg-interactive-selected border-interactive-selected"
                      : "border-border bg-surface-base hover:bg-interactive-hover"
                  }`}
                >
                  {isSelected ? (
                    <Check className="text-primary absolute top-2.5 right-2.5 h-3.5 w-3.5" />
                  ) : null}
                  <span className="pr-5 text-sm font-semibold">{meta.short}</span>
                  <span className="text-muted-foreground text-xs">{meta.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {warnings.pdic ? (
        <Alert variant="warning">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{warnings.pdic}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
