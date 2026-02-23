"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  normalizeNumericInput,
  percentToDecimalString,
  toNumber,
} from "@/components/dashboard/utils";
import type { Bank } from "@/lib/types";
import type { DepositFormErrors } from "@/components/dashboard/types";

function toBankId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

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

type BankSelectorProps = {
  banks: Bank[];
  bankName: string;
  errors: DepositFormErrors;
  onBankSelect: (bankId: string, bankName: string) => void;
  onBankNameChange: (value: string) => void;
  onCustomBankAdd: (bank: Bank) => void;
  onCustomBankCancel: () => void;
  onCustomBankFormChange?: (isOpen: boolean) => void;
};

export default function BankSelector({
  banks,
  bankName,
  errors,
  onBankSelect,
  onBankNameChange,
  onCustomBankAdd,
  onCustomBankCancel,
  onCustomBankFormChange,
}: BankSelectorProps) {
  const [bankOpen, setBankOpen] = useState(false);
  const [bankActiveIndex, setBankActiveIndex] = useState(0);
  const [customBankOpen, setCustomBankOpen] = useState(false);
  const [customBankName, setCustomBankName] = useState("");
  const [customBankTaxRate, setCustomBankTaxRate] = useState("20");
  const [customBankPdicMember, setCustomBankPdicMember] = useState(false);
  const [customBankErrors, setCustomBankErrors] = useState<{
    name?: string;
    taxRate?: string;
  }>({});

  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = bankName.trim().toLowerCase();
  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(normalizedQuery),
  );
  const bankOptions = [
    ...filteredBanks.map((bank) => ({ id: bank.id, label: bank.name })),
    { id: "__custom__", label: "Add custom bank" },
  ];

  const safeBankActiveIndex =
    bankOptions.length === 0 ? 0 : Math.min(bankActiveIndex, bankOptions.length - 1);

  useEffect(() => {
    const node = optionRefs.current[safeBankActiveIndex];
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [safeBankActiveIndex]);

  function openCustomBankForm() {
    setCustomBankOpen(true);
    setCustomBankName("");
    setCustomBankTaxRate("20");
    setCustomBankPdicMember(false);
    setCustomBankErrors({});
    onCustomBankFormChange?.(true);
  }

  function closeCustomBankForm() {
    setCustomBankOpen(false);
    setCustomBankErrors({});
    onCustomBankFormChange?.(false);
  }

  return (
    <div className="space-y-2 text-sm">
      <Label htmlFor="bank" className="flex items-center gap-1">
        Bank <RequiredIndicator />
      </Label>
      <div className="relative">
        <Input
          id="bank"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={bankOpen}
          aria-controls="bank-options"
          aria-invalid={Boolean(errors.bankId)}
          aria-describedby={errors.bankId ? "error-bank" : undefined}
          value={bankName}
          onChange={(event) => {
            const next = event.target.value;
            setBankActiveIndex(0);
            onBankNameChange(next);
            if (!bankOpen) setBankOpen(true);
          }}
          onFocus={() => {
            setBankOpen(true);
            setBankActiveIndex(0);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              const next = document.activeElement;
              if (next && listboxRef.current?.contains(next)) return;
              setBankOpen(false);
            }, 120);
          }}
          placeholder="Search or select a bank"
        />

        {bankOpen ? (
          <div
            id="bank-options"
            role="listbox"
            ref={listboxRef}
            className="border-border bg-surface-base absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border p-2 shadow-sm"
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-1">
              {bankOptions.map((option, index) => {
                const isCustom = option.id === "__custom__";
                const bank = banks.find((item) => item.id === option.id);
                return (
                  <div key={option.id}>
                    {isCustom ? <div className="border-border my-1 border-t" /> : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={safeBankActiveIndex === index}
                      tabIndex={safeBankActiveIndex === index ? 0 : -1}
                      ref={(node) => {
                        optionRefs.current[index] = node;
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                        safeBankActiveIndex === index
                          ? "bg-muted text-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        if (isCustom) {
                          openCustomBankForm();
                          setBankOpen(false);
                          return;
                        }
                        onBankSelect(option.id, option.label);
                        setBankOpen(false);
                      }}
                    >
                      <span>{isCustom ? "+ Add custom bank" : option.label}</span>
                      {!isCustom && bank ? (
                        <span className="text-muted-foreground text-badge">
                          {bank.pdicMember === false ? "No PDIC" : "PDIC"}
                        </span>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <p id="error-bank" className="text-danger-fg min-h-5 text-xs">
        {errors.bankId ?? ""}
      </p>

      {customBankOpen ? (
        <div className="border-border bg-surface-soft space-y-3 rounded-md border p-3">
          <h4 className="text-sm font-semibold">Add custom bank</h4>
          <div className="space-y-2 text-sm">
            <Label htmlFor="custom-bank-name">
              Bank name <RequiredIndicator />
            </Label>
            <Input
              id="custom-bank-name"
              value={customBankName}
              onChange={(event) => setCustomBankName(event.target.value)}
            />
            <p className="text-danger-fg min-h-4 text-xs">
              {customBankErrors.name ?? ""}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <Label htmlFor="custom-bank-tax">
              Tax rate (%) <RequiredIndicator />
            </Label>
            <Input
              id="custom-bank-tax"
              value={customBankTaxRate}
              onChange={(event) =>
                setCustomBankTaxRate(normalizeNumericInput(event.target.value, 2))
              }
            />
            <p className="text-danger-fg min-h-4 text-xs">
              {customBankErrors.taxRate ?? ""}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary"
              checked={customBankPdicMember}
              onChange={(event) => setCustomBankPdicMember(event.target.checked)}
            />
            PDIC member
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const nextErrors: { name?: string; taxRate?: string } = {};
                if (!customBankName.trim()) {
                  nextErrors.name = "Bank name is required.";
                }
                const tax = toNumber(customBankTaxRate);
                if (!customBankTaxRate || tax < 0 || tax > 100) {
                  nextErrors.taxRate = "Tax rate must be between 0 and 100.";
                }
                setCustomBankErrors(nextErrors);
                if (Object.keys(nextErrors).length > 0) return;

                const cleanedName = customBankName.trim();
                const nextBankId = toBankId(cleanedName);
                const customBank: Bank = {
                  id: nextBankId,
                  name: cleanedName,
                  taxRate: percentToDecimalString(customBankTaxRate)
                    ? toNumber(percentToDecimalString(customBankTaxRate))
                    : 0.2,
                  pdicMember: customBankPdicMember,
                };

                onCustomBankAdd(customBank);
                onBankSelect(nextBankId, cleanedName);
                closeCustomBankForm();
              }}
            >
              Save bank
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                closeCustomBankForm();
                onCustomBankCancel();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
