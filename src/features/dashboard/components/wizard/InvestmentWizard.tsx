"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWizardState } from "@/features/dashboard/hooks/useWizardState";
import { InvestmentForm } from "./InvestmentForm";
import { LiveCalcPreview } from "./LiveCalcPreview";
import type { TimeDeposit } from "@/types";
import { XIcon } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvestmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (deposit: TimeDeposit) => void;
  existingBankNames: string[];
  /** Reserved for edit mode — not implemented yet */
  initialDeposit?: TimeDeposit;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InvestmentWizard({
  open,
  onOpenChange,
  onSave,
  existingBankNames,
  initialDeposit,
}: InvestmentWizardProps) {
  const {
    formState,
    errors,
    warnings,
    isDirty,
    discardOpen,
    setDiscardOpen,
    setField,
    touchField,
    canSubmit,
    reset,
    loadDeposit,
    deriveYieldInput,
    buildDeposit,
  } = useWizardState();

  const isEditing = !!initialDeposit;

  const [timeZone, setTimeZone] = useState<string | undefined>(undefined)

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  useEffect(() => {
    if (open) {
      if (initialDeposit) {
        loadDeposit(initialDeposit);
      } else {
        reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setDiscardOpen(true);
    } else {
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange, setDiscardOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    },
    [requestClose],
  );

  const handleDiscard = () => {
    setDiscardOpen(false);
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const deposit = buildDeposit(initialDeposit?.id ?? crypto.randomUUID());
    onSave(deposit);
    onOpenChange(false);
  };

  const yieldInput = deriveYieldInput();

  return (
    <>
      {/* ── Discard confirm ──────────────────────────────────── */}
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditing ? "Discard changes?" : "Discard this investment?"}</AlertDialogTitle>
            <AlertDialogDescription>Your inputs will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDiscard}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Wizard dialog ────────────────────────────────────── */}
      <Dialog
        modal={true}
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
          else onOpenChange(true);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onKeyDown={handleKeyDown}
          className="flex flex-col gap-0 p-0 sm:max-w-4xl max-h-[min(90dvh,780px)] overflow-hidden"
        >
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between border-b pl-6 pr-4 py-4 shrink-0">
            <DialogTitle className="text-base font-semibold">{isEditing ? "Edit investment" : "Add investment"}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={requestClose}
              className="text-muted-foreground"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Scrollable form pane */}
            <div className="flex-1 overflow-y-auto p-6">
              <DialogDescription className="mb-8">Configure your principal, rates, and term details to generate a real-time yield projection.</DialogDescription>
              <InvestmentForm
                formState={formState}
                errors={errors}
                warnings={warnings}
                setField={setField}
                touchField={touchField}
                existingBankNames={existingBankNames}
                timeZone={timeZone}
              />
            </div>

            {/* Desktop preview pane */}
            <aside className="hidden sm:flex w-80 shrink-0 flex-col border-l overflow-y-auto">
              <div className="px-4 py-6 flex-1">
                <LiveCalcPreview input={yieldInput} />
              </div>
            </aside>
          </div>

          {/* Mobile calc strip */}
          <div className="sm:hidden shrink-0">
            <LiveCalcPreview input={yieldInput} compact />
          </div>

          {/* Footer */}
          <DialogFooter className="shrink-0">
            <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
              {isEditing ? "Save changes" : "Add investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
