"use client";

import { useState } from "react";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { productTypeLabel } from "@/components/dashboard/utils";
import type { Bank } from "@/lib/types";

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
  const [customBankFormOpen, setCustomBankFormOpen] = useState(false);

  const showProductSelector = form.bankId && !customBankFormOpen;

  return (
    <section className="space-y-5" aria-label="Step 1 Bank and Product">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Step 1 - Bank &amp; Product</h3>
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
        errors={errors}
        onBankSelect={onBankSelect}
        onBankNameChange={onBankNameChange}
        onCustomBankAdd={onCustomBankAdd}
        onCustomBankCancel={onCustomBankCancel}
        onCustomBankFormChange={setCustomBankFormOpen}
      />

      {showProductSelector ? (
        <div className="space-y-2 text-sm">
          <span className="inline-block text-sm font-medium" id="product-type">
            Product type{" "}
            <span className="text-danger-fg" aria-hidden>
              *
            </span>
            <span className="sr-only"> required</span>
          </span>
          <div>
            <ToggleGroup
              type="single"
              value={form.productType}
              aria-labelledby="product-type"
              onValueChange={(value) => {
                if (!value) return;
                onProductSelect(value as ProductType);
              }}
            >
              {productOptions.map((product) => (
                <ToggleGroupItem key={product.productType} value={product.productType}>
                  {productTypeLabel(product.productType)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <p className="text-danger-fg min-h-5 text-xs">{errors.productType ?? ""}</p>
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
