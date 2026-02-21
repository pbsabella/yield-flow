"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import Header from "@/components/dashboard/Header";
import StatsGrid from "@/components/dashboard/StatsGrid";
import EmptyState from "@/components/dashboard/EmptyState";
import LadderTable from "@/components/dashboard/LadderTable";
import MonthlyFlow from "@/components/dashboard/MonthlyFlow";
import DepositFormDialog from "@/components/dashboard/DepositFormDialog";
import ConfirmDeleteDialog from "@/components/dashboard/ConfirmDeleteDialog";
import type { DepositFormErrors, DepositFormState } from "@/components/dashboard/types";
import { toNumber, validateDeposit } from "@/components/dashboard/utils";

import { buildMonthlyAllowance } from "@/lib/domain/cashflow";
import { formatMonthLabel, monthKey } from "@/lib/domain/date";
import { buildDepositSummary } from "@/lib/domain/interest";
import { banks as demoBanks, deposits as demoDeposits } from "@/lib/demo";
import type { Bank, TimeDeposit } from "@/lib/types";

const initialForm: DepositFormState = {
  bankId: "",
  bankName: "",
  name: "",
  principal: "",
  startDate: "",
  termMonths: "6",
  tenurePreset: "30d",
  termType: "fixed",
  payoutFrequency: "monthly",
  interestMode: "simple",
  interestTreatment: "reinvest",
  compounding: "daily",
  taxRate: "0.2",
  tier1Cap: "1000000",
  tier1Rate: "0.0325",
  tier2Rate: "0.0375",
  flatRate: "0.0325",
};

const EMPTY_DEPOSITS: TimeDeposit[] = [];
const DEPOSITS_STORAGE_KEY = "yieldflow-deposits";

const bankAliases: Record<string, string> = {
  ob: "OwnBank",
  ownbank: "OwnBank",
  maribank: "MariBank",
  mari: "MariBank",
};

function resolveBankName(bankId: string, depositName: string) {
  const base = depositName.includes(" - ") ? depositName.split(" - ")[0].trim() : bankId;
  const normalized = base.toLowerCase().replace(/\s+/g, "");
  return bankAliases[normalized] ?? base;
}

export default function DashboardClient() {
  const [banks, setBanks] = useState<Bank[]>(demoBanks);
  const [form, setForm] = useState<DepositFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<DepositFormErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showMatured, setShowMatured] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [sampleBannerDismissed, setSampleBannerDismissed] = useState(false);
  const [deposits, setDeposits] = useState<TimeDeposit[]>(EMPTY_DEPOSITS);
  const [sampleDataActive, setSampleDataActive] = useState(false);
  const [hasSavedToBrowser, setHasSavedToBrowser] = useState(false);
  const isReady = true;

  const activeDeposits = useMemo(
    () => deposits.filter((deposit) => deposit.status !== "settled"),
    [deposits],
  );

  const buildSummaries = useCallback(
    (items: TimeDeposit[]) => {
      const bankMap = new Map(banks.map((bank) => [bank.id, bank]));

      for (const deposit of items) {
        if (bankMap.has(deposit.bankId)) continue;
        const inferredName = resolveBankName(deposit.bankId, deposit.name);
        bankMap.set(deposit.bankId, {
          id: deposit.bankId,
          name: inferredName,
          taxRate: 0.2,
        });
      }

      return items
        .map((deposit) => buildDepositSummary(deposit, bankMap.get(deposit.bankId)!))
        .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
    },
    [banks],
  );

  const summaries = useMemo(
    () => buildSummaries(activeDeposits),
    [buildSummaries, activeDeposits],
  );
  const allSummaries = useMemo(
    () => buildSummaries(deposits),
    [buildSummaries, deposits],
  );

  const maturedSummaries = useMemo(() => {
    if (!showMatured) return [];
    const settled = deposits.filter((deposit) => deposit.status === "settled");
    if (settled.length === 0) return [];
    const bankMap = new Map(banks.map((bank) => [bank.id, bank]));
    for (const deposit of settled) {
      if (bankMap.has(deposit.bankId)) continue;
      const inferredName = resolveBankName(deposit.bankId, deposit.name);
      bankMap.set(deposit.bankId, {
        id: deposit.bankId,
        name: inferredName,
        taxRate: 0.2,
      });
    }
    return settled
      .map((deposit) => buildDepositSummary(deposit, bankMap.get(deposit.bankId)!))
      .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
  }, [banks, deposits, showMatured]);

  const monthlyAllowance = useMemo(
    () => buildMonthlyAllowance(allSummaries),
    [allSummaries],
  );

  const totalPrincipal = activeDeposits.reduce(
    (sum, deposit) => sum + deposit.principal,
    0,
  );
  const currentMonthKey = monthKey(new Date());
  const currentMonthLabel = formatMonthLabel(new Date());

  const {
    currentMonthIncomeTotal,
    currentMonthIncomePending,
    currentMonthIncomeSettled,
  } = useMemo(() => {
    let pending = 0;
    let settled = 0;

    for (const summary of allSummaries) {
      if (summary.deposit.isOpenEnded) continue;
      if (monthKey(new Date(summary.maturityDate)) !== currentMonthKey) continue;
      if (summary.deposit.status === "settled") {
        settled += summary.netInterest;
      } else if (summary.deposit.status === "matured") {
        pending += summary.netInterest;
      }
    }

    return {
      currentMonthIncomeTotal: pending + settled,
      currentMonthIncomePending: pending,
      currentMonthIncomeSettled: settled,
    };
  }, [allSummaries, currentMonthKey]);

  const nextMaturity = useMemo(
    () => summaries.find((summary) => !summary.deposit.isOpenEnded),
    [summaries],
  );

  function resetForm() {
    setForm(initialForm);
    setFormErrors({});
    setEditingId(null);
  }

  function handleSubmit(nextForm: DepositFormState) {
    const errors = validateDeposit(nextForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const bankMatch = banks.find(
      (bank) => bank.name.toLowerCase() === nextForm.bankName.trim().toLowerCase(),
    );

    const isOpenEnded = nextForm.termType === "open";
    const payoutFrequency =
      nextForm.termType === "open" ? "monthly" : nextForm.payoutFrequency;
    const interestTreatment =
      payoutFrequency === "monthly" ? "payout" : nextForm.interestTreatment;
    const existingStatus = editingId
      ? deposits.find((item) => item.id === editingId)?.status
      : undefined;

    const newDeposit: TimeDeposit = {
      id: editingId ?? `td-${crypto.randomUUID()}`,
      bankId: bankMatch?.id ?? nextForm.bankId,
      name: nextForm.name.trim(),
      principal: toNumber(nextForm.principal),
      startDate: nextForm.startDate,
      termMonths: Math.max(0.1, toNumber(nextForm.termMonths)),
      interestMode: nextForm.interestMode,
      interestTreatment,
      compounding: nextForm.compounding,
      taxRateOverride: toNumber(nextForm.taxRate),
      flatRate: toNumber(nextForm.flatRate),
      tiers:
        nextForm.interestMode === "tiered"
          ? [
              {
                upTo: toNumber(nextForm.tier1Cap) || null,
                rate: toNumber(nextForm.tier1Rate),
              },
              { upTo: null, rate: toNumber(nextForm.tier2Rate) },
            ]
          : [{ upTo: null, rate: toNumber(nextForm.flatRate) }],
      payoutFrequency,
      isOpenEnded,
      status: existingStatus ?? "active",
    };

    const nextDeposits = editingId
      ? deposits.map((item) => (item.id === editingId ? newDeposit : item))
      : [newDeposit, ...deposits];
    setDeposits(nextDeposits);
    setSampleDataActive(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(nextDeposits));
    }
    setHasSavedToBrowser(true);

    resetForm();
    setDialogOpen(false);
  }

  const seedDemoData = useCallback(() => {
    setSampleDataActive(true);
    setDeposits(demoDeposits);
  }, [setDeposits, setSampleDataActive]);

  function downloadBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      deposits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yieldflow-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result ?? "").trim();
        const content = JSON.parse(raw) as
          | { deposits?: TimeDeposit[]; banks?: Bank[] }
          | TimeDeposit[];
        const nextDeposits = Array.isArray(content)
          ? content
          : Array.isArray(content.deposits)
            ? content.deposits
            : null;
        const nextBanks =
          !Array.isArray(content) && Array.isArray(content.banks) ? content.banks : null;

        if (!nextDeposits) {
          setImportMessage("Import failed: missing deposits array.");
          return;
        }

        if (nextBanks && nextBanks.length > 0) {
          setBanks(nextBanks);
        }

        setDeposits(nextDeposits);
        setSampleDataActive(false);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(nextDeposits));
        }
        setHasSavedToBrowser(true);
        setImportMessage(`Imported ${nextDeposits.length} deposits.`);
      } catch {
        setImportMessage("Import failed: invalid JSON.");
      }
    };
    reader.readAsText(file);
  }

  function handleEdit(id: string) {
    const deposit = deposits.find((item) => item.id === id);
    if (!deposit) return;
    setEditingId(id);
    setForm({
      bankId: deposit.bankId,
      bankName: banks.find((bank) => bank.id === deposit.bankId)?.name ?? "",
      name: deposit.name,
      principal: String(deposit.principal),
      startDate: deposit.startDate,
      termMonths: String(deposit.termMonths),
      tenurePreset: deposit.isOpenEnded ? "open" : "custom",
      termType: deposit.isOpenEnded ? "open" : "fixed",
      payoutFrequency: deposit.payoutFrequency,
      interestMode: deposit.interestMode,
      interestTreatment: deposit.interestTreatment ?? "reinvest",
      compounding: deposit.compounding ?? "daily",
      taxRate: String(deposit.taxRateOverride ?? 0.2),
      tier1Cap: String(deposit.tiers[0]?.upTo ?? 1000000),
      tier1Rate: String(deposit.tiers[0]?.rate ?? 0.03),
      tier2Rate: String(deposit.tiers[1]?.rate ?? deposit.tiers[0]?.rate ?? 0.03),
      flatRate: String(deposit.flatRate),
    });
    setFormErrors({});
    setDialogOpen(true);
    setFormSession((current) => current + 1);
  }

  function handleDelete(id: string) {
    const nextDeposits = deposits.filter((item) => item.id !== id);
    setDeposits(nextDeposits);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(nextDeposits));
    }
    setHasSavedToBrowser(true);
  }

  function handleMarkMatured(id: string) {
    const nextDeposits = deposits.map((item) => {
      if (item.id !== id) return item;
      if (item.status === "settled") return item;
      return { ...item, status: "settled" as const };
    });
    setDeposits(nextDeposits);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEPOSITS_STORAGE_KEY, JSON.stringify(nextDeposits));
    }
    setHasSavedToBrowser(true);
  }

  const showSampleBanner = sampleDataActive && !sampleBannerDismissed;
  const emptyStateCtaLabel = "Load sample data";

  return (
    <div className="bg-page text-primary min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-10 pb-10 md:px-10">
        <Alert variant="warning">
          <BellRing className="h-4 w-4" />
          <AlertTitle>Work in progress</AlertTitle>
          <AlertDescription>
            YieldFlow is actively being built. Some features may change as I refine the
            experience — your data and feedback help shape what comes next. Values are
            estimates and may differ from bank-posted figures since institutions can use
            different interest conventions (for example, day-count basis like /365).
          </AlertDescription>
        </Alert>
        {showSampleBanner ? (
          <Alert variant="info" className="flex items-start gap-3 pr-10">
            <div>
              <AlertTitle>Using sample data</AlertTitle>
              <AlertDescription>
                This is pre-filled test data so you can explore YieldFlow. Clear it
                anytime in{" "}
                <a
                  href="#data-management"
                  className="font-semibold underline underline-offset-4 hover:text-indigo-700 dark:hover:text-indigo-200"
                  onClick={(event) => {
                    event.preventDefault();
                    document
                      .getElementById("data-management")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Data Management
                </a>{" "}
                below.
              </AlertDescription>
            </div>
            <button
              type="button"
              className="text-muted-foreground focus-visible:ring-primary/60 absolute top-3 right-3 rounded-md p-1 transition-colors duration-150 ease-out hover:text-indigo-700 focus-visible:ring-2"
              onClick={() => setSampleBannerDismissed(true)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </Alert>
        ) : null}
        <Header />
        <StatsGrid
          totalPrincipal={totalPrincipal}
          currentMonthIncomeTotal={currentMonthIncomeTotal}
          currentMonthIncomePending={currentMonthIncomePending}
          currentMonthIncomeSettled={currentMonthIncomeSettled}
          currentMonthLabel={currentMonthLabel}
          nextMaturity={nextMaturity}
        />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 md:px-10">
        <section className="bg-portfolio-surface border-subtle rounded-2xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Portfolio actions</h2>
            </div>
            <DepositFormDialog
              key={`${editingId ?? "new"}-${formSession}`}
              open={dialogOpen}
              onOpenChange={(open) => {
                if (!open) resetForm();
                setDialogOpen(open);
                if (open) setFormSession((current) => current + 1);
              }}
              trigger={
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white shadow-sm transition-colors duration-150 ease-out hover:bg-indigo-500 active:bg-indigo-700"
                >
                  Add investment
                </Button>
              }
              title={editingId ? "Edit investment" : "Add an investment"}
              banks={banks}
              form={form}
              errors={formErrors}
              onValidate={setFormErrors}
              onSubmit={handleSubmit}
              onReset={resetForm}
            />
          </div>

          {!isReady ? (
            <div className="border-subtle bg-surface-soft text-muted mt-6 rounded-2xl border p-6 text-sm">
              Loading your portfolio...
            </div>
          ) : deposits.length === 0 ? (
            <EmptyState onSeed={seedDemoData} ctaLabel={emptyStateCtaLabel} />
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <Tabs defaultValue="ladder">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="ladder">Timeline</TabsTrigger>
                    <TabsTrigger value="monthly">Cash Flow</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="ladder" className="mt-4">
                  <label className="border-subtle bg-surface text-muted mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                    <input
                      type="checkbox"
                      className="accent-indigo-600"
                      checked={showMatured}
                      onChange={(event) => setShowMatured(event.target.checked)}
                    />
                    Show settled
                  </label>
                  <LadderTable
                    summaries={[...summaries, ...maturedSummaries]}
                    onEdit={handleEdit}
                    onDeleteRequest={(id) => setDeleteId(id)}
                    onMarkMatured={handleMarkMatured}
                  />
                </TabsContent>
                <TabsContent value="monthly" className="mt-4">
                  <MonthlyFlow
                    items={monthlyAllowance}
                    currentMonthKey={currentMonthKey}
                    currentMonthPending={currentMonthIncomePending}
                    currentMonthSettled={currentMonthIncomeSettled}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>

        <section
          id="data-management"
          className="border-subtle bg-surface rounded-2xl border p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Data Management</h2>
              <p className="text-muted text-sm">Your data stays on your device</p>
            </div>
            <span className="border-subtle bg-surface-soft text-muted rounded-lg border px-3 py-1 text-xs">
              {hasSavedToBrowser ? "Saved to Browser" : "Not saved yet"}
            </span>
          </div>
          <p className="text-muted mt-2 text-sm">
            Everything is stored privately on this device — no accounts, no servers, no
            tracking. Use the backup option to keep a copy safe.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="hover:bg-muted active:bg-muted"
              onClick={downloadBackup}
            >
              Download Backup (JSON)
            </Button>
            <label htmlFor="import-json" className="sr-only">
              Import JSON file
            </label>
            <input
              ref={importInputRef}
              id="import-json"
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImport(file);
                event.currentTarget.value = "";
              }}
            />
            <Button
              variant="outline"
              type="button"
              className="hover:bg-muted active:bg-muted"
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </Button>
            <Button
              variant="ghost"
              className="text-rose-700 hover:bg-rose-500/10 active:bg-rose-500/20 active:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-400/20 dark:active:bg-rose-400/30 dark:active:text-rose-100"
              onClick={() => {
                setDeposits([]);
                setSampleDataActive(false);
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(DEPOSITS_STORAGE_KEY);
                }
                setHasSavedToBrowser(false);
              }}
            >
              Clear All Data
            </Button>
          </div>
          {importMessage ? (
            <p className="text-muted mt-3 text-xs">{importMessage}</p>
          ) : null}
        </section>
      </main>
      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
      <footer className="border-subtle bg-surface/60 text-muted mt-10 border-t px-6 py-6 text-center text-xs md:px-10">
        <span>© {new Date().getFullYear()} </span>
        <a
          href="https://pbsabella.github.io/"
          className="focus-visible:ring-primary/60 text-indigo-600 underline-offset-4 transition-colors duration-150 ease-out hover:text-indigo-700 hover:underline focus-visible:ring-2 active:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 dark:active:text-indigo-200"
          target="_blank"
          rel="noreferrer"
        >
          pbsabella
        </a>
      </footer>
    </div>
  );
}
