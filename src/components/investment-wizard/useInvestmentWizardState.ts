"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TimeDeposit } from "@/lib/types";
import type { BankProduct } from "@/lib/banks-config";
import { getBankProducts } from "@/lib/banks-config";
import type {
  DepositFormErrors,
  DepositFormState,
  DepositFormWarnings,
  ProductType,
  TierInput,
} from "@/components/dashboard/types";
import {
  buildWarnings,
  convertTermMonthsToEndDate,
  ensureFinalUnlimitedTier,
  toNumber,
  unformatCurrencyInput,
  validateDeposit,
} from "@/components/dashboard/utils";
import { toISODate } from "@/lib/domain/date";

export type PendingSelectionChange = {
  nextForm: DepositFormState;
  message: string;
};

export type ProductOption = {
  productType: ProductType;
  template?: BankProduct;
};

export function defaultTierInputs(rate: string): TierInput[] {
  return ensureFinalUnlimitedTier([
    { id: "tier-1", upTo: "1000000", rate },
    { id: "tier-2", upTo: "", rate },
  ]);
}

export function getProductOptions(bankId: string): ProductOption[] {
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

function createFormWithBankReset(
  base: DepositFormState,
  bankId: string,
  bankName: string,
): DepositFormState {
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

export function applyProductDefaults(
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

const defaultForm: DepositFormState = {
  bankId: "",
  bankName: "",
  productId: "",
  productType: "",
  name: "",
  principal: "",
  startDate: "",
  isOpenEnded: false,
  termMonths: "6",
  endDate: "",
  termInputMode: "months",
  payoutFrequency: "monthly",
  compounding: "daily",
  taxRate: "0.2",
  rate: "",
  dayCountConvention: 365,
  tieredEnabled: false,
  tiers: [
    { id: "tier-1", upTo: "1000000", rate: "" },
    { id: "tier-2", upTo: "", rate: "" },
  ],
};

type Props = {
  open: boolean;
  initialForm?: DepositFormState;
  isEditMode: boolean;
  deposits: TimeDeposit[];
  onClose: () => void;
  onSubmit: (form: DepositFormState) => void;
};

export function useInvestmentWizardState({
  open,
  initialForm,
  isEditMode,
  deposits,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(isEditMode ? 2 : 1);
  const [draftForm, setDraftForm] = useState<DepositFormState>(
    initialForm ?? defaultForm,
  );
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<DepositFormErrors>({});
  const [discardPromptOpen, setDiscardPromptOpen] = useState(false);
  const [pendingSelectionChange, setPendingSelectionChange] =
    useState<PendingSelectionChange | null>(null);
  const [confirmedSelection, setConfirmedSelection] = useState({
    bankId: initialForm?.bankId ?? "",
    productType: initialForm?.productType ?? "",
  });

  // Reset all state when wizard opens
  useEffect(() => {
    if (!open) return;

    const today = toISODate(new Date());
    const base = initialForm ?? defaultForm;
    const normalized: DepositFormState = {
      ...base,
      startDate: base.startDate || today,
      principal: base.principal || "",
      tiers: ensureFinalUnlimitedTier(
        base.tiers.length ? base.tiers : defaultTierInputs(base.rate || ""),
      ),
    };

    const handle = window.setTimeout(() => {
      setDraftForm(normalized);
      setDirtyFields(new Set());
      setErrors({});
      setStep(isEditMode ? 2 : 1);
      setPendingSelectionChange(null);
      setDiscardPromptOpen(false);
      setConfirmedSelection({
        bankId: normalized.bankId,
        productType: normalized.productType,
      });
    }, 0);

    return () => window.clearTimeout(handle);
  }, [open, initialForm, isEditMode]);

  const isDirty = dirtyFields.size > 0;

  const productOptions = useMemo(() => {
    if (!draftForm.bankId) return [];
    return getProductOptions(draftForm.bankId);
  }, [draftForm.bankId]);

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

  // Generic single-field update — marks the field dirty
  const updateField = useCallback(
    <K extends keyof DepositFormState>(key: K, value: DepositFormState[K]) => {
      setDirtyFields((prev) => new Set([...prev, String(key)]));
      setDraftForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Multi-field atomic update — marks all provided keys dirty
  const updateFields = useCallback((partial: Partial<DepositFormState>) => {
    const keys = Object.keys(partial);
    setDirtyFields((prev) => new Set([...prev, ...keys]));
    setDraftForm((prev) => ({ ...prev, ...partial }));
  }, []);

  // Validate a single field on blur and merge into errors
  const updateFieldError = useCallback(
    (field: keyof DepositFormErrors, form: DepositFormState) => {
      const nextErrors = validateDeposit(form);
      setErrors((prev) => {
        const merged = { ...prev };
        if (nextErrors[field]) {
          merged[field] = nextErrors[field];
        } else {
          delete merged[field];
        }
        return merged;
      });
    },
    [],
  );

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
    setDirtyFields((prev) => new Set([...prev, "bankId", "bankName"]));

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

    setDirtyFields((prev) => new Set([...prev, "productType", "productId"]));
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

  function handleBankNameInput(value: string) {
    setDraftForm((prev) => ({
      ...prev,
      bankName: value,
      bankId: "",
      productId: "",
      productType: "",
    }));
  }

  function resetBankSelection() {
    setDraftForm((prev) => ({
      ...prev,
      bankName: "",
      bankId: "",
      productId: "",
      productType: "",
    }));
  }

  function confirmSelectionChange() {
    if (!pendingSelectionChange) return;
    setDraftForm(pendingSelectionChange.nextForm);
    setConfirmedSelection({
      bankId: pendingSelectionChange.nextForm.bankId,
      productType: pendingSelectionChange.nextForm.productType,
    });
    setPendingSelectionChange(null);
  }

  function cancelSelectionChange() {
    setPendingSelectionChange(null);
  }

  const showTermFields = draftForm.productType !== "savings" || !draftForm.isOpenEnded;

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
        setErrors((prev) => ({ ...prev, ...nextErrors }));
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const nextErrors = validateDeposit(draftForm);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setStep(3);
    }
  }

  function handleBack() {
    setStep((current) => (current - 1) as 1 | 2 | 3);
  }

  function requestClose() {
    if (isDirty) {
      setDiscardPromptOpen(true);
      return;
    }
    onClose();
  }

  function handleDiscard() {
    setDiscardPromptOpen(false);
    setDirtyFields(new Set());
    setErrors({});
    onClose();
  }

  function handleSubmit() {
    const nextErrors = validateDeposit(draftForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(2);
      return;
    }
    onSubmit(draftForm);
    setDirtyFields(new Set());
  }

  function resetToBaseline() {
    const today = toISODate(new Date());
    const base = initialForm ?? defaultForm;
    const normalized: DepositFormState = {
      ...base,
      startDate: base.startDate || today,
      principal: base.principal || "",
      tiers: ensureFinalUnlimitedTier(
        base.tiers.length ? base.tiers : defaultTierInputs(base.rate || ""),
      ),
    };
    setDraftForm(normalized);
    setDirtyFields(new Set());
    setErrors({});
    setPendingSelectionChange(null);
    setStep(isEditMode ? 2 : 1);
  }

  return {
    // State
    step,
    setStep,
    draftForm,
    errors,
    warnings,
    discardPromptOpen,
    setDiscardPromptOpen,
    pendingSelectionChange,
    isDirty,
    productOptions,
    stepOneReady: stepOneIsReady(),
    stepTwoReady: stepTwoHasRequiredValues(),
    // Actions
    updateField,
    updateFields,
    updateFieldError,
    applyBankSelection,
    applyProductSelection,
    handleBankNameInput,
    resetBankSelection,
    confirmSelectionChange,
    cancelSelectionChange,
    handleNext,
    handleBack,
    requestClose,
    handleDiscard,
    handleSubmit,
    resetToBaseline,
  };
}
