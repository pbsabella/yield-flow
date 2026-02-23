"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  Landmark,
  Plus,
  Trash2,
  TriangleAlert,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import DatePicker from "@/components/dashboard/DatePicker";
import type {
  DepositFormErrors,
  DepositFormState,
  DepositFormWarnings,
  ProductType,
  TierInput,
} from "@/components/dashboard/types";
import {
  buildWarnings,
  convertEndDateToTermMonths,
  convertTermMonthsToEndDate,
  decimalToPercentString,
  ensureFinalUnlimitedTier,
  formatCurrencyInput,
  labelToMonthYear,
  normalizeNumericInput,
  parseTierInputs,
  percentToDecimalString,
  productTypeLabel,
  toNumber,
  unformatCurrencyInput,
  validateDeposit,
} from "@/components/dashboard/utils";
import type { Bank, InterestTier, TimeDeposit } from "@/lib/types";
import { buildDepositSummary } from "@/lib/domain/interest";
import { formatDate, toISODate } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";
import { getBankProducts, type BankProduct } from "@/lib/banks-config";
import { useMediaQuery } from "@/lib/state/useMediaQuery";

type ProductOption = {
  productType: ProductType;
  template?: BankProduct;
};

type PendingSelectionChange = {
  nextForm: DepositFormState;
  message: string;
};

function toBankId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getSuggestedName(bankName: string, productType: ProductType | "") {
  if (!bankName || !productType) return "";
  const suffix =
    productType === "td-maturity"
      ? "TD"
      : productType === "td-monthly"
        ? "TD Monthly"
        : "Savings";
  return `${bankName} - ${suffix}`;
}

function defaultTierInputs(rate: string) {
  return ensureFinalUnlimitedTier([
    { id: "tier-1", upTo: "1000000", rate },
    { id: "tier-2", upTo: "", rate },
  ]);
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

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debouncedValue;
}

function normalizeComparableForm(form: DepositFormState) {
  return {
    ...form,
    principal: unformatCurrencyInput(form.principal),
    tiers: ensureFinalUnlimitedTier(form.tiers).map((tier) => ({
      upTo: tier.upTo,
      rate: tier.rate,
    })),
  };
}

function getProductOptions(bankId: string): ProductOption[] {
  if (!bankId) return [];
  const templates = getBankProducts(bankId);
  if (templates.length === 0) {
    return [
      { productType: "td-maturity" },
      { productType: "td-monthly" },
      { productType: "savings" },
    ];
  }

  const byType = new Map<ProductType, BankProduct>();
  for (const item of templates) {
    if (!byType.has(item.productType)) {
      byType.set(item.productType, item);
    }
  }

  return [...byType.entries()].map(([productType, template]) => ({
    productType,
    template,
  }));
}

function createFormWithBankReset(
  base: DepositFormState,
  bankId: string,
  bankName: string,
) {
  return {
    ...base,
    bankId,
    bankName,
    productId: "",
    productType: "" as const,
    isOpenEnded: false,
    termMonths: "",
    endDate: "",
    rate: "",
    tieredEnabled: false,
    tiers: defaultTierInputs(base.rate || ""),
    lastUpdated: undefined,
    notes: undefined,
  };
}

function applyProductDefaults(
  base: DepositFormState,
  option: ProductOption,
): DepositFormState {
  const template = option.template;
  const isSavings = option.productType === "savings";
  const rate = template ? String(template.defaultRate) : base.rate || "";
  const taxRate = template ? String(template.defaultTaxRate) : base.taxRate || "0.2";
  const compounding = template
    ? template.defaultCompounding
    : isSavings
      ? "daily"
      : "monthly";
  const payoutFrequency = template
    ? template.defaultPayoutFrequency
    : option.productType === "td-maturity"
      ? "maturity"
      : "monthly";

  const tiers: TierInput[] = template?.defaultTiers
    ? ensureFinalUnlimitedTier(
        template.defaultTiers.map((tier, index) => ({
          id: `tier-${index + 1}`,
          upTo: tier.upTo === null ? "" : String(tier.upTo),
          rate: String(tier.rate),
        })),
      )
    : defaultTierInputs(rate);

  const nextTermMonths = isSavings
    ? base.termMonths || "12"
    : String(template?.defaultTermMonths ?? (base.termMonths || "6"));

  const next: DepositFormState = {
    ...base,
    productType: option.productType,
    productId: template?.id ?? `${base.bankId}-${option.productType}`,
    isOpenEnded: isSavings,
    termMonths: nextTermMonths,
    endDate: convertTermMonthsToEndDate(base.startDate, nextTermMonths),
    payoutFrequency,
    compounding,
    taxRate,
    rate,
    dayCountConvention: template?.dayCountConvention ?? 365,
    tieredEnabled: Boolean(template?.isTiered),
    tiers,
    lastUpdated: template?.lastUpdated,
    notes: template?.notes,
  };

  if (!next.name.trim()) {
    next.name = getSuggestedName(next.bankName, next.productType);
  }

  return next;
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  title: string;
  banks: Bank[];
  deposits: TimeDeposit[];
  form: DepositFormState;
  errors: DepositFormErrors;
  onValidate: (next: DepositFormErrors) => void;
  onSubmit: (nextForm: DepositFormState) => void;
  isEditMode: boolean;
};

export default function DepositFormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  banks,
  deposits,
  form,
  errors,
  onValidate,
  onSubmit,
  isEditMode,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [step, setStep] = useState<1 | 2 | 3>(isEditMode ? 2 : 1);
  const [draftForm, setDraftForm] = useState<DepositFormState>(form);
  const [baselineForm, setBaselineForm] = useState<DepositFormState | null>(null);
  const [confirmedSelection, setConfirmedSelection] = useState({
    bankId: form.bankId,
    productType: form.productType,
  });

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
  const [customBanks, setCustomBanks] = useState<Bank[]>([]);

  const [pendingSelectionChange, setPendingSelectionChange] =
    useState<PendingSelectionChange | null>(null);
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false);

  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const debouncedForm = useDebouncedValue(draftForm, 300);

  useEffect(() => {
    if (!open) return;

    const today = toISODate(new Date());
    const normalized = {
      ...form,
      startDate: form.startDate || today,
      principal: form.principal || "",
      tiers: ensureFinalUnlimitedTier(
        form.tiers.length ? form.tiers : defaultTierInputs(form.rate || ""),
      ),
    };

    const handle = window.setTimeout(() => {
      setDraftForm(normalized);
      setBaselineForm(normalized);
      setConfirmedSelection({
        bankId: normalized.bankId,
        productType: normalized.productType,
      });
      setStep(isEditMode ? 2 : 1);
      setPendingSelectionChange(null);
      setMobilePreviewExpanded(false);
      setDiscardPromptOpen(false);
      setCustomBankOpen(false);
      setCustomBankName("");
      setCustomBankTaxRate("20");
      setCustomBankPdicMember(false);
      setCustomBankErrors({});
    }, 0);
    return () => window.clearTimeout(handle);
  }, [form, isEditMode, open]);

  useEffect(() => {
    if (open) return;
    onValidate({});
  }, [open, onValidate]);

  const availableBanks = useMemo(() => {
    const map = new Map<string, Bank>();
    for (const bank of banks) map.set(bank.id, bank);
    for (const bank of customBanks) map.set(bank.id, bank);
    return [...map.values()];
  }, [banks, customBanks]);

  const hasUnsavedChanges = useMemo(() => {
    if (!baselineForm) return false;
    return (
      JSON.stringify(normalizeComparableForm(draftForm)) !==
      JSON.stringify(normalizeComparableForm(baselineForm))
    );
  }, [baselineForm, draftForm]);

  function requestClose() {
    if (hasUnsavedChanges) {
      setDiscardPromptOpen(true);
      return;
    }
    onValidate({});
    onOpenChange(false);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    requestClose();
  }

  const bankQuery = draftForm.bankName;
  const normalizedQuery = bankQuery.trim().toLowerCase();
  const filteredBanks = availableBanks.filter((bank) =>
    bank.name.toLowerCase().includes(normalizedQuery),
  );
  const bankOptions = [
    ...filteredBanks.map((bank) => ({ id: bank.id, label: bank.name })),
  ];
  bankOptions.push({ id: "__custom__", label: "Add custom bank" });

  const safeBankActiveIndex =
    bankOptions.length === 0 ? 0 : Math.min(bankActiveIndex, bankOptions.length - 1);

  useEffect(() => {
    const node = optionRefs.current[safeBankActiveIndex];
    if (node) node.scrollIntoView({ block: "nearest" });
  }, [safeBankActiveIndex]);

  const productOptions = useMemo(() => {
    if (!draftForm.bankId || customBankOpen) return [];
    return getProductOptions(draftForm.bankId);
  }, [customBankOpen, draftForm.bankId]);

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

  function applyOrQueueSelectionChange(nextForm: DepositFormState, message: string) {
    if (!isEditMode) {
      setDraftForm(nextForm);
      return;
    }

    const isChanged =
      nextForm.bankId !== confirmedSelection.bankId ||
      nextForm.productType !== confirmedSelection.productType;

    if (!isChanged) {
      setDraftForm(nextForm);
      return;
    }

    setPendingSelectionChange({ nextForm, message });
  }

  function applyBankSelection(bankId: string, bankName: string) {
    if (bankId === confirmedSelection.bankId) {
      setDraftForm((current) => ({ ...current, bankId, bankName }));
      return;
    }

    const next = createFormWithBankReset(draftForm, bankId, bankName);
    applyOrQueueSelectionChange(
      next,
      "Changing the bank will reset product and rate fields. Principal and start date will be kept.",
    );
  }

  function applyProductSelection(productType: ProductType) {
    const option = productOptions.find((item) => item.productType === productType);
    if (!option) return;

    const next = applyProductDefaults(draftForm, option);
    if (
      productType === confirmedSelection.productType &&
      next.bankId === confirmedSelection.bankId
    ) {
      setDraftForm(next);
      return;
    }

    if (!confirmedSelection.productType) {
      setDraftForm(next);
      return;
    }

    applyOrQueueSelectionChange(
      next,
      "Changing the product type will reset rate and term fields. Principal and start date will be kept.",
    );
  }

  const bankPrincipalTotal = useMemo(() => {
    const principal = toNumber(unformatCurrencyInput(draftForm.principal));
    const existingTotal = deposits
      .filter(
        (deposit) => deposit.bankId === draftForm.bankId && deposit.status !== "settled",
      )
      .reduce((sum, deposit) => sum + deposit.principal, 0);
    return existingTotal + principal;
  }, [deposits, draftForm.bankId, draftForm.principal]);

  const warnings: DepositFormWarnings = useMemo(
    () => buildWarnings(draftForm, bankPrincipalTotal),
    [bankPrincipalTotal, draftForm],
  );

  const hasPreviewData =
    toNumber(unformatCurrencyInput(debouncedForm.principal)) > 0 &&
    toNumber(debouncedForm.rate) > 0;

  const previewSummary = useMemo(() => {
    if (!hasPreviewData) return null;

    const principal = toNumber(unformatCurrencyInput(debouncedForm.principal));
    const tiers = debouncedForm.tieredEnabled
      ? parseTierInputs(debouncedForm.tiers)
      : [{ upTo: null, rate: toNumber(debouncedForm.rate) }];

    const previewDeposit: TimeDeposit = {
      id: "preview",
      bankId: debouncedForm.bankId || "preview-bank",
      name: debouncedForm.name || "New investment",
      principal,
      startDate: debouncedForm.startDate || toISODate(new Date()),
      termMonths: Math.max(0.1, toNumber(debouncedForm.termMonths || "12")),
      interestMode: debouncedForm.tieredEnabled ? "tiered" : "simple",
      interestTreatment:
        debouncedForm.payoutFrequency === "monthly" ? "payout" : "reinvest",
      compounding: debouncedForm.compounding,
      taxRateOverride: toNumber(debouncedForm.taxRate),
      flatRate: toNumber(debouncedForm.rate),
      tiers,
      payoutFrequency: debouncedForm.isOpenEnded
        ? "monthly"
        : debouncedForm.payoutFrequency,
      dayCountConvention: debouncedForm.dayCountConvention,
      isOpenEnded: debouncedForm.isOpenEnded,
    };

    const bank =
      availableBanks.find((item) => item.id === previewDeposit.bankId) ??
      ({
        id: previewDeposit.bankId,
        name: debouncedForm.bankName || "Custom bank",
        taxRate: 0.2,
      } as Bank);

    return buildDepositSummary(previewDeposit, bank);
  }, [availableBanks, debouncedForm, hasPreviewData]);

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

  const showOpenEndedToggle = draftForm.productType === "savings";
  const showTermFields = draftForm.productType !== "savings" || !draftForm.isOpenEnded;
  const showPayoutFrequency = draftForm.productType !== "savings";

  function stepOneIsReady() {
    return Boolean(draftForm.bankId && draftForm.productType);
  }

  function stepTwoHasRequiredValues() {
    const hasRateValue = draftForm.tieredEnabled
      ? draftForm.tiers.some((tier) => Boolean(tier.rate))
      : Boolean(draftForm.rate);
    const hasCore =
      Boolean(draftForm.name.trim()) &&
      Boolean(unformatCurrencyInput(draftForm.principal)) &&
      Boolean(draftForm.startDate) &&
      hasRateValue;

    if (!hasCore) return false;
    if (!showTermFields) return true;
    if (draftForm.termInputMode === "months") return Boolean(draftForm.termMonths);
    return Boolean(draftForm.endDate);
  }

  function handleNext() {
    if (step === 1) {
      if (!stepOneIsReady()) {
        const nextErrors: DepositFormErrors = {};
        if (!draftForm.bankId) nextErrors.bankId = "Bank is required.";
        if (!draftForm.productType) nextErrors.productType = "Product type is required.";
        onValidate({ ...errors, ...nextErrors });
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const nextErrors = validateDeposit(draftForm);
      onValidate(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(3);
    }
  }

  function resetToBaseline() {
    if (!baselineForm) return;
    setDraftForm(baselineForm);
    onValidate({});
    setPendingSelectionChange(null);
    setStep(isEditMode ? 2 : 1);
  }

  function renderStepSummaries() {
    if (step === 1) return null;

    return (
      <div className="border-border bg-surface-soft space-y-2 rounded-md border p-3 text-xs">
        <div className="flex items-center justify-between">
          <p className="text-foreground font-semibold">Step 1 summary</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
            Change
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Bank</span>
          <span className="font-medium">{draftForm.bankName || "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Product</span>
          <span className="font-medium">
            {productTypeLabel(draftForm.productType) || "-"}
          </span>
        </div>
      </div>
    );
  }

  const mobileStickyBar =
    !isDesktop && previewSummary ? (
      <div className="border-border bg-surface fixed right-0 bottom-0 left-0 z-50 border-t px-4 py-3 shadow-lg">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setMobilePreviewExpanded((value) => !value)}
        >
          <span className="text-muted-foreground text-xs">
            Running net interest
            {!draftForm.isOpenEnded ? (
              <span className="ml-2">
                · Matures {formatDate(new Date(previewSummary.maturityDate))}
              </span>
            ) : null}
          </span>
          <span className="text-income-net font-financial text-sm font-semibold">
            {formatPhpCurrency(previewSummary.netInterest)}
          </span>
        </button>
        {mobilePreviewExpanded ? (
          <div className="border-border mt-3 space-y-2 border-t pt-3 text-sm">
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
            {debouncedForm.payoutFrequency === "monthly" ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly net</span>
                <span className="font-financial">{formatPhpCurrency(monthlyNet)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    ) : null;

  const livePreviewCard = (
    <aside className="bg-surface border-subtle sticky top-0 rounded-xl border p-5 lg:top-6">
      <div className="text-secondary-foreground flex items-center gap-2 text-sm font-semibold">
        <Calculator className="text-income-net h-4 w-4" />
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
          <div className="bg-status-info flex items-center justify-between rounded-md px-3 py-2">
            <span className="text-status-info-fg font-medium">Net interest</span>
            <span className="text-income-net font-financial font-semibold">
              {formatPhpCurrency(previewSummary.netInterest)}
            </span>
          </div>
          {!draftForm.isOpenEnded ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Maturity date</span>
              <span className="font-financial">
                {formatDate(new Date(previewSummary.maturityDate))}
              </span>
            </div>
          ) : null}
          {draftForm.payoutFrequency === "monthly" ? (
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

  const StepHeader = (
    <div className="space-y-2" aria-label="Wizard steps">
      <p className="text-muted-foreground text-xs font-semibold">Step {step} of 3</p>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {[1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className={`text-badge inline-flex h-6 w-6 items-center justify-center rounded-full border font-semibold ${
                step >= index
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-border bg-surface text-muted-foreground"
              }`}
              aria-current={step === index ? "step" : undefined}
            >
              {step > index ? <Check className="h-3.5 w-3.5" /> : index}
            </span>
            {index < 3 ? <span className="bg-border h-px w-6" /> : null}
          </div>
        ))}
      </div>
    </div>
  );

  const StepOne = (
    <section className="space-y-5" aria-label="Step 1 Bank and Product">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Step 1 - Bank & Product</h3>
        <p className="text-muted-foreground text-xs">
          Select a bank and product type to continue.
        </p>
      </div>

      {pendingSelectionChange ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{pendingSelectionChange.message}</AlertDescription>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setDraftForm(pendingSelectionChange.nextForm);
                setConfirmedSelection({
                  bankId: pendingSelectionChange.nextForm.bankId,
                  productType: pendingSelectionChange.nextForm.productType,
                });
                setPendingSelectionChange(null);
              }}
            >
              Confirm change
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPendingSelectionChange(null)}
            >
              Cancel
            </Button>
          </div>
        </Alert>
      ) : null}

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
            value={bankQuery}
            onChange={(event) => {
              const next = event.target.value;
              setBankActiveIndex(0);
              setDraftForm((current) => ({
                ...current,
                bankName: next,
                bankId: "",
                productId: "",
                productType: "",
              }));
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
              className="border-border bg-surface absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border p-2 shadow-sm"
              onMouseDown={(event) => event.preventDefault()}
            >
              <div className="flex flex-col gap-1">
                {bankOptions.map((option, index) => {
                  const isCustom = option.id === "__custom__";
                  const bank = availableBanks.find((item) => item.id === option.id);
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
                            setCustomBankOpen(true);
                            const nextErrors = { ...errors };
                            delete nextErrors.bankId;
                            delete nextErrors.productType;
                            onValidate(nextErrors);
                            setDraftForm((current) => ({
                              ...current,
                              bankName: "Custom bank",
                              bankId: "",
                              productId: "",
                              productType: "",
                            }));
                            setCustomBankName("");
                            setBankOpen(false);
                            return;
                          }

                          applyBankSelection(option.id, option.label);
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
      </div>

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

                const bankName = customBankName.trim();
                const nextBankId = toBankId(bankName);
                const customBank: Bank = {
                  id: nextBankId,
                  name: bankName,
                  taxRate: percentToDecimalString(customBankTaxRate)
                    ? toNumber(percentToDecimalString(customBankTaxRate))
                    : 0.2,
                  pdicMember: customBankPdicMember,
                };
                setCustomBanks((current) => {
                  const exists = current.some((bank) => bank.id === customBank.id);
                  if (exists) {
                    return current.map((bank) =>
                      bank.id === customBank.id ? customBank : bank,
                    );
                  }
                  return [customBank, ...current];
                });
                const resetDraft = createFormWithBankReset(
                  draftForm,
                  nextBankId,
                  bankName,
                );
                const next = {
                  ...resetDraft,
                  taxRate: percentToDecimalString(customBankTaxRate),
                  notes: customBankPdicMember
                    ? undefined
                    : "This bank may not be covered by PDIC.",
                };

                applyOrQueueSelectionChange(
                  next,
                  "Changing the bank will reset product and rate fields. Principal and start date will be kept.",
                );
                setCustomBankOpen(false);
                setCustomBankErrors({});
              }}
            >
              Save bank
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomBankOpen(false);
                setCustomBankErrors({});
                setDraftForm((current) => ({
                  ...current,
                  bankName: "",
                  bankId: "",
                  productId: "",
                  productType: "",
                }));
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {draftForm.bankId && !customBankOpen ? (
        <div className="space-y-2 text-sm">
          <Label className="inline-block" id="product-type">
            Product type <RequiredIndicator />
          </Label>
          <div>
            <ToggleGroup
              type="single"
              value={draftForm.productType}
              aria-labelledby="product-type"
              onValueChange={(value) => {
                if (!value) return;
                applyProductSelection(value as ProductType);
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

  const StepTwo = (
    <section className="space-y-5" aria-label="Step 2 Investment Details">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Step 2 - Investment Details</h3>
          <p className="text-muted-foreground text-xs">Only relevant fields are shown.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
          Change
        </Button>
      </div>

      {renderStepSummaries()}

      <div className="space-y-2 text-sm">
        <Label htmlFor="name">
          Investment name <RequiredIndicator />
        </Label>
        <Input
          id="name"
          value={draftForm.name}
          onChange={(event) => setDraftForm({ ...draftForm, name: event.target.value })}
          onBlur={() => updateFieldError("name", draftForm)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "error-name" : undefined}
        />
        <p id="error-name" className="text-danger-fg min-h-5 text-xs">
          {errors.name ?? ""}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <Label htmlFor="principal">
          Principal amount <RequiredIndicator />
        </Label>
        <Input
          id="principal"
          inputMode="decimal"
          value={draftForm.principal}
          onFocus={() =>
            setDraftForm({
              ...draftForm,
              principal: unformatCurrencyInput(draftForm.principal),
            })
          }
          onChange={(event) =>
            setDraftForm({
              ...draftForm,
              principal: normalizeNumericInput(
                unformatCurrencyInput(event.target.value),
                2,
              ),
            })
          }
          onBlur={() => {
            const next = {
              ...draftForm,
              principal: formatCurrencyInput(unformatCurrencyInput(draftForm.principal)),
            };
            setDraftForm(next);
            updateFieldError("principal", next);
          }}
          aria-invalid={Boolean(errors.principal)}
          aria-describedby={errors.principal ? "error-principal" : undefined}
        />
        <p id="error-principal" className="text-danger-fg min-h-5 text-xs">
          {errors.principal ?? ""}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <Label htmlFor="startDate">
          Start date <RequiredIndicator />
        </Label>
        <DatePicker
          id="startDate"
          value={draftForm.startDate}
          onChange={(value) => {
            const next = {
              ...draftForm,
              startDate: value,
              endDate:
                draftForm.termInputMode === "months"
                  ? convertTermMonthsToEndDate(value, draftForm.termMonths)
                  : draftForm.endDate,
            };
            setDraftForm(next);
          }}
          onBlur={() => updateFieldError("startDate", draftForm)}
          className={errors.startDate ? "border-danger-border" : undefined}
        />
        <p className="text-danger-fg min-h-5 text-xs">{errors.startDate ?? ""}</p>
        {warnings.startDate ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {warnings.startDate}
          </p>
        ) : null}
      </div>

      {showOpenEndedToggle ? (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={draftForm.isOpenEnded}
            onChange={(event) =>
              setDraftForm({ ...draftForm, isOpenEnded: event.target.checked })
            }
          />
          No fixed maturity date
        </label>
      ) : null}

      {showTermFields ? (
        <>
          <div className="space-y-2 text-sm">
            <Label className="inline-block" id="term-mode">
              Term input mode
            </Label>
            <div>
              <ToggleGroup
                type="single"
                value={draftForm.termInputMode}
                aria-labelledby="term-mode"
                onValueChange={(value) => {
                  if (!value) return;
                  if (value === "end-date") {
                    setDraftForm({
                      ...draftForm,
                      termInputMode: "end-date",
                      endDate: convertTermMonthsToEndDate(
                        draftForm.startDate,
                        draftForm.termMonths,
                      ),
                    });
                    return;
                  }
                  setDraftForm({
                    ...draftForm,
                    termInputMode: "months",
                    termMonths: convertEndDateToTermMonths(
                      draftForm.startDate,
                      draftForm.endDate,
                    ),
                  });
                }}
              >
                <ToggleGroupItem value="months">Months</ToggleGroupItem>
                <ToggleGroupItem value="end-date">Pick end date</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {draftForm.termInputMode === "months" ? (
            <div className="space-y-2 text-sm">
              <Label className="inline-block" htmlFor="termMonths">
                Term (months) <RequiredIndicator />
              </Label>
              <Input
                id="termMonths"
                inputMode="decimal"
                value={draftForm.termMonths}
                onChange={(event) => {
                  const nextTerm = normalizeNumericInput(event.target.value, 2);
                  setDraftForm({
                    ...draftForm,
                    termMonths: nextTerm,
                    endDate: convertTermMonthsToEndDate(draftForm.startDate, nextTerm),
                  });
                }}
                onBlur={() => updateFieldError("termMonths", draftForm)}
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
                      setDraftForm({
                        ...draftForm,
                        termMonths: nextMonths,
                        endDate: convertTermMonthsToEndDate(
                          draftForm.startDate,
                          nextMonths,
                        ),
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
                value={draftForm.endDate}
                onChange={(value) => {
                  setDraftForm({
                    ...draftForm,
                    endDate: value,
                    termMonths: convertEndDateToTermMonths(draftForm.startDate, value),
                  });
                }}
                onBlur={() => updateFieldError("endDate", draftForm)}
                className={errors.endDate ? "border-danger-border" : undefined}
              />
              <p className="text-danger-fg min-h-5 text-xs">{errors.endDate ?? ""}</p>
            </div>
          )}
        </>
      ) : null}

      <div className="border-border bg-surface-soft space-y-3 rounded-md border p-3 text-sm">
        <Label className="block text-sm font-semibold">Interest Rate</Label>

        {!draftForm.tieredEnabled ? (
          <>
            <Label htmlFor="rate" className="block">
              Annual interest rate <RequiredIndicator />
            </Label>
            <div className="relative">
              <Input
                id="rate"
                inputMode="decimal"
                value={decimalToPercentString(draftForm.rate)}
                onChange={(event) => {
                  const normalizedPercent = normalizeNumericInput(event.target.value, 6);
                  setDraftForm({
                    ...draftForm,
                    rate: percentToDecimalString(normalizedPercent),
                  });
                }}
                onBlur={() => updateFieldError("rate", draftForm)}
                aria-invalid={Boolean(errors.rate)}
                aria-describedby={errors.rate ? "error-rate" : "rate-help"}
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                %
              </span>
            </div>
            <p id="rate-help" className="text-muted-foreground text-xs">
              Starting point only — verify with your bank
              {draftForm.lastUpdated
                ? ` · Last updated ${labelToMonthYear(draftForm.lastUpdated)}`
                : ""}
            </p>
            {draftForm.notes ? (
              <p className="text-muted-foreground text-xs">{draftForm.notes}</p>
            ) : null}
            {warnings.rate ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {warnings.rate}
              </p>
            ) : null}
            <p id="error-rate" className="text-danger-fg min-h-5 text-xs">
              {errors.rate ?? ""}
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-xs font-semibold">Tier builder</p>
            {ensureFinalUnlimitedTier(draftForm.tiers).map((tier, index, arr) => {
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
                            const next = draftForm.tiers.map((item) =>
                              item.id === tier.id
                                ? { ...item, upTo: unformatCurrencyInput(item.upTo) }
                                : item,
                            );
                            setDraftForm({
                              ...draftForm,
                              tiers: ensureFinalUnlimitedTier(next),
                            });
                          }}
                          onChange={(event) => {
                            const next = draftForm.tiers.map((item) =>
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
                            setDraftForm({
                              ...draftForm,
                              tiers: ensureFinalUnlimitedTier(next),
                            });
                          }}
                          onBlur={() => {
                            const next = draftForm.tiers.map((item) =>
                              item.id === tier.id
                                ? {
                                    ...item,
                                    upTo: formatCurrencyInput(
                                      unformatCurrencyInput(item.upTo),
                                    ),
                                  }
                                : item,
                            );
                            setDraftForm({
                              ...draftForm,
                              tiers: ensureFinalUnlimitedTier(next),
                            });
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
                          const next = draftForm.tiers.map((item) =>
                            item.id === tier.id
                              ? {
                                  ...item,
                                  rate: percentToDecimalString(normalizedPercent),
                                }
                              : item,
                          );
                          setDraftForm({
                            ...draftForm,
                            tiers: ensureFinalUnlimitedTier(next),
                          });
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
                          const next = draftForm.tiers.filter(
                            (item) => item.id !== tier.id,
                          );
                          setDraftForm({
                            ...draftForm,
                            tiers: ensureFinalUnlimitedTier(next),
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {warnings.tiers ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {warnings.tiers}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const next = ensureFinalUnlimitedTier(draftForm.tiers);
                next.splice(Math.max(next.length - 1, 0), 0, {
                  id: `tier-${crypto.randomUUID()}`,
                  upTo: "",
                  rate: next[0]?.rate || draftForm.rate,
                });
                setDraftForm({ ...draftForm, tiers: ensureFinalUnlimitedTier(next) });
              }}
            >
              <Plus className="h-4 w-4" /> Add tier
            </Button>
          </>
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-primary"
            checked={draftForm.tieredEnabled}
            onChange={(event) => {
              if (event.target.checked) {
                const next = ensureFinalUnlimitedTier(draftForm.tiers);
                next[0] = {
                  ...next[0],
                  rate: draftForm.rate || next[0]?.rate || "",
                };
                setDraftForm({
                  ...draftForm,
                  tieredEnabled: true,
                  tiers: next,
                });
                return;
              }

              const firstTierRate =
                ensureFinalUnlimitedTier(draftForm.tiers)[0]?.rate || draftForm.rate;
              setDraftForm({
                ...draftForm,
                tieredEnabled: false,
                rate: firstTierRate,
              });
            }}
          />
          This account uses tiered rates
        </label>
      </div>

      {showPayoutFrequency ? (
        <div className="space-y-2 text-sm">
          <Label id="payout-label">Payout frequency</Label>
          <ToggleGroup
            type="single"
            value={draftForm.payoutFrequency}
            aria-labelledby="payout-label"
            onValueChange={(value) => {
              if (!value) return;
              setDraftForm({
                ...draftForm,
                payoutFrequency: value as "monthly" | "maturity",
              });
            }}
          >
            <ToggleGroupItem value="maturity">At maturity</ToggleGroupItem>
            <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : null}

      <fieldset className="space-y-2 text-sm">
        <Label id="compounding" className="block">
          Compounding
        </Label>
        <ToggleGroup
          type="single"
          value={draftForm.compounding}
          aria-labelledby="compounding"
          onValueChange={(value) => {
            if (!value) return;
            setDraftForm({ ...draftForm, compounding: value as "daily" | "monthly" });
          }}
        >
          <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
        </ToggleGroup>
      </fieldset>

      <div className="space-y-2 text-sm">
        <Label htmlFor="taxRate">Withholding tax (%)</Label>
        <div className="relative">
          <Input
            id="taxRate"
            inputMode="decimal"
            value={decimalToPercentString(draftForm.taxRate)}
            onChange={(event) => {
              const normalizedPercent = normalizeNumericInput(event.target.value, 6);
              setDraftForm({
                ...draftForm,
                taxRate: percentToDecimalString(normalizedPercent),
              });
            }}
            onBlur={() => updateFieldError("taxRate", draftForm)}
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

  const StepThree = (
    <section className="space-y-5" aria-label="Step 3 Review and Confirm">
      <div>
        <h3 className="text-sm font-semibold">Step 3 - Review & Confirm</h3>
        <p className="text-muted-foreground text-xs">Review your inputs before saving.</p>
      </div>

      {renderStepSummaries()}

      <div className="border-border bg-surface-soft space-y-2 rounded-md border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Investment name</span>
          <span className="font-medium">{draftForm.name || "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Principal</span>
          <span className="font-financial font-medium">
            {formatPhpCurrency(toNumber(unformatCurrencyInput(draftForm.principal)))}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rate</span>
          <span className="font-financial font-medium">
            {decimalToPercentString(draftForm.rate)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Withholding tax</span>
          <span className="font-financial font-medium">
            {decimalToPercentString(draftForm.taxRate)}%
          </span>
        </div>
      </div>

      {previewSummary ? (
        <div className="border-status-info bg-status-info space-y-2 rounded-md border p-4 text-sm">
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
          <div className="text-income-net flex items-center justify-between">
            <span className="font-semibold">Net interest</span>
            <span className="font-financial font-semibold">
              {formatPhpCurrency(previewSummary.netInterest)}
            </span>
          </div>
          {!draftForm.isOpenEnded ? (
            <div className="flex items-center justify-between">
              <span>Maturity date</span>
              <span className="font-financial">
                {formatDate(new Date(previewSummary.maturityDate))}
              </span>
            </div>
          ) : null}
          {draftForm.payoutFrequency === "monthly" ? (
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
    </section>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          requestClose();
        }}
        className="top-auto right-0 bottom-0 left-0 max-w-6xl translate-x-0 translate-y-0 rounded-t-2xl p-0 sm:top-8 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] sm:translate-x-[-50%] sm:translate-y-0 sm:overflow-hidden sm:rounded-2xl"
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-border border-b px-6 pt-6 pr-12 pb-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Smart investment capture with a guided step-by-step flow.
            </DialogDescription>
            {StepHeader}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 sm:pb-6">
            {discardPromptOpen ? (
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Discard changes? Your inputs will be lost.
                </AlertDescription>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscardPromptOpen(false)}
                  >
                    Keep editing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="alert"
                    onClick={() => {
                      setDiscardPromptOpen(false);
                      onValidate({});
                      onOpenChange(false);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </Alert>
            ) : null}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const nextErrors = validateDeposit(draftForm);
                onValidate(nextErrors);
                if (Object.keys(nextErrors).length > 0) {
                  setStep(2);
                  return;
                }
                onSubmit(draftForm);
              }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <p aria-live="polite" className="sr-only">
                {previewSummary
                  ? `Net interest ${formatPhpCurrency(previewSummary.netInterest)}${
                      draftForm.isOpenEnded
                        ? ""
                        : `. Maturity date ${formatDate(new Date(previewSummary.maturityDate))}`
                    }`
                  : "Enter principal and rate to see your projection"}
              </p>
              <div className="order-last space-y-6 lg:order-first">
                {step === 1 ? StepOne : null}
                {step === 2 ? StepTwo : null}
                {step === 3 ? StepThree : null}

                <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={resetToBaseline}>
                      Reset
                    </Button>
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3)}
                      >
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    {step < 3 ? (
                      <Button
                        type="button"
                        disabled={
                          step === 1
                            ? !stepOneIsReady() || Boolean(pendingSelectionChange)
                            : !stepTwoHasRequiredValues()
                        }
                        onClick={handleNext}
                      >
                        Next <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit">
                        {isEditMode ? "Save changes" : "Add investment"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-first hidden lg:order-last lg:block">
                {livePreviewCard}
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
      {open ? mobileStickyBar : null}
    </Dialog>
  );
}
