"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import Step1BankProduct from "./Step1BankProduct";
import Step2Details from "./Step2Details";
import Step3Review from "./Step3Review";
import LiveCalcPreview from "./LiveCalcPreview";
import { useInvestmentWizardState } from "./useInvestmentWizardState";

import type { DepositFormState } from "@/components/dashboard/types";
import type { Bank, TimeDeposit } from "@/lib/types";

export type AddInvestmentWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  banks: Bank[];
  deposits: TimeDeposit[];
  initialForm?: DepositFormState;
  isEditMode: boolean;
  onSubmit: (form: DepositFormState) => void;
  onCustomBankAdd: (bank: Bank) => void;
};

export default function WizardShell({
  open,
  onOpenChange,
  trigger,
  banks,
  deposits,
  initialForm,
  isEditMode,
  onSubmit,
  onCustomBankAdd,
}: AddInvestmentWizardProps) {
  const title = isEditMode ? "Edit investment" : "Add an investment";

  const wizard = useInvestmentWizardState({
    open,
    initialForm,
    isEditMode,
    deposits,
    onClose: () => onOpenChange(false),
    onSubmit: (form) => {
      onSubmit(form);
      onOpenChange(false);
    },
  });

  const selectedBank = useMemo((): Bank | undefined => {
    if (!wizard.draftForm.bankId) return undefined;
    return (
      banks.find((b) => b.id === wizard.draftForm.bankId) ?? {
        id: wizard.draftForm.bankId,
        name: wizard.draftForm.bankName || "Custom bank",
        taxRate: 0.2,
      }
    );
  }, [banks, wizard.draftForm.bankId, wizard.draftForm.bankName]);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    wizard.requestClose();
  }

  const stepHeader = (
    <div className="space-y-2" aria-label="Wizard steps">
      <p className="text-muted-foreground text-xs font-semibold">
        Step {wizard.step} of 3
      </p>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {[1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className={`text-badge inline-flex h-6 w-6 items-center justify-center rounded-full border font-semibold ${
                wizard.step >= index
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-base text-muted-foreground"
              }`}
              aria-current={wizard.step === index ? "step" : undefined}
            >
              {wizard.step > index ? <Check className="h-3.5 w-3.5" /> : index}
            </span>
            {index < 3 ? <span className="bg-border h-px w-6" /> : null}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          wizard.requestClose();
        }}
        className="top-auto right-0 bottom-0 left-0 max-w-6xl translate-x-0 translate-y-0 rounded-t-2xl p-0 sm:top-8 sm:right-auto sm:bottom-auto sm:left-1/2 sm:h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] sm:translate-x-[-50%] sm:translate-y-0 sm:overflow-hidden sm:rounded-2xl"
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-border border-b px-6 pt-6 pr-12 pb-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Smart investment capture with a guided step-by-step flow.
            </DialogDescription>
            {stepHeader}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 sm:pb-6">
            {wizard.discardPromptOpen ? (
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
                    onClick={() => wizard.setDiscardPromptOpen(false)}
                  >
                    Keep editing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="alert"
                    onClick={wizard.handleDiscard}
                  >
                    Discard
                  </Button>
                </div>
              </Alert>
            ) : null}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                wizard.handleSubmit();
              }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="order-last space-y-6 lg:order-first">
                {wizard.step === 1 ? (
                  <Step1BankProduct
                    form={wizard.draftForm}
                    errors={wizard.errors}
                    warnings={wizard.warnings}
                    banks={banks}
                    productOptions={wizard.productOptions}
                    pendingSelectionChange={wizard.pendingSelectionChange}
                    onBankSelect={wizard.applyBankSelection}
                    onBankNameChange={wizard.handleBankNameInput}
                    onProductSelect={wizard.applyProductSelection}
                    onCustomBankAdd={onCustomBankAdd}
                    onCustomBankCancel={wizard.resetBankSelection}
                    onConfirmSelectionChange={wizard.confirmSelectionChange}
                    onCancelSelectionChange={wizard.cancelSelectionChange}
                  />
                ) : null}

                {wizard.step === 2 ? (
                  <Step2Details
                    form={wizard.draftForm}
                    errors={wizard.errors}
                    warnings={wizard.warnings}
                    onUpdate={wizard.updateFields}
                    onFieldBlur={(field) =>
                      wizard.updateFieldError(field, wizard.draftForm)
                    }
                    onGoToStep1={() => wizard.setStep(1)}
                  />
                ) : null}

                {wizard.step === 3 ? (
                  <Step3Review
                    form={wizard.draftForm}
                    bank={selectedBank}
                    warnings={wizard.warnings}
                    isEditMode={isEditMode}
                    onGoToStep1={() => wizard.setStep(1)}
                  />
                ) : null}

                {/* Navigation bar */}
                <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={wizard.resetToBaseline}
                    >
                      Reset
                    </Button>
                    {wizard.step > 1 ? (
                      <Button type="button" variant="outline" onClick={wizard.handleBack}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    {wizard.step < 3 ? (
                      <Button
                        type="button"
                        disabled={
                          wizard.step === 1
                            ? !wizard.stepOneReady ||
                              Boolean(wizard.pendingSelectionChange)
                            : !wizard.stepTwoReady
                        }
                        onClick={wizard.handleNext}
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

              <LiveCalcPreview draftForm={wizard.draftForm} bank={selectedBank} />
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
