"use client";

import { useMemo, useRef, useState } from "react";
import { BellRing } from "lucide-react";

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
import { useLocalStorage } from "@/lib/state/useLocalStorage";
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
  const {
    value: deposits,
    setValue: setDeposits,
    isReady,
  } = useLocalStorage<TimeDeposit[]>("yieldflow-deposits", EMPTY_DEPOSITS);
  const [form, setForm] = useState<DepositFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<DepositFormErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showMatured, setShowMatured] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const activeDeposits = useMemo(
    () => deposits.filter((deposit) => deposit.status !== "matured"),
    [deposits],
  );

  const summaries = useMemo(() => {
    const bankMap = new Map(banks.map((bank) => [bank.id, bank]));

    for (const deposit of activeDeposits) {
      if (bankMap.has(deposit.bankId)) continue;
      const inferredName = resolveBankName(deposit.bankId, deposit.name);
      bankMap.set(deposit.bankId, {
        id: deposit.bankId,
        name: inferredName,
        taxRate: 0.2,
      });
    }

    return activeDeposits
      .map((deposit) => buildDepositSummary(deposit, bankMap.get(deposit.bankId)!))
      .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
  }, [banks, activeDeposits]);

  const maturedSummaries = useMemo(() => {
    if (!showMatured) return [];
    const matured = deposits.filter((deposit) => deposit.status === "matured");
    if (matured.length === 0) return [];
    const bankMap = new Map(banks.map((bank) => [bank.id, bank]));
    for (const deposit of matured) {
      if (bankMap.has(deposit.bankId)) continue;
      const inferredName = resolveBankName(deposit.bankId, deposit.name);
      bankMap.set(deposit.bankId, {
        id: deposit.bankId,
        name: inferredName,
        taxRate: 0.2,
      });
    }
    return matured
      .map((deposit) => buildDepositSummary(deposit, bankMap.get(deposit.bankId)!))
      .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));
  }, [banks, deposits, showMatured]);

  const monthlyAllowance = useMemo(() => buildMonthlyAllowance(summaries), [summaries]);

  const totalPrincipal = activeDeposits.reduce(
    (sum, deposit) => sum + deposit.principal,
    0,
  );
  const currentMonthKey = monthKey(new Date());
  const currentMonth = monthlyAllowance.find((item) => item.monthKey === currentMonthKey);
  const currentMonthLabel = currentMonth?.label ?? formatMonthLabel(new Date());
  const currentMonthGross = currentMonth?.gross ?? 0;
  const currentMonthNet = currentMonth?.net ?? 0;

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

    const newDeposit: TimeDeposit = {
      id: editingId ?? `td-${crypto.randomUUID()}`,
      bankId: bankMatch?.id ?? nextForm.bankId,
      name: nextForm.name.trim(),
      principal: toNumber(nextForm.principal),
      startDate: nextForm.startDate,
      termMonths: Math.max(1, toNumber(nextForm.termMonths)),
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
    };

    setDeposits((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? newDeposit : item));
      }
      return [newDeposit, ...current];
    });

    resetForm();
    setDialogOpen(false);
  }

  function seedDemoData() {
    setDeposits(demoDeposits);
  }

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
    setDeposits((current) => current.filter((item) => item.id !== id));
  }

  function handleMarkMatured(id: string) {
    setDeposits((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "matured" } : item)),
    );
  }

  return (
    <div className="bg-page text-primary min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-10 pb-10 md:px-10">
        <Alert variant="warning">
          <BellRing className="h-4 w-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            YieldFlow is still a work in progress. I am actively refining the UI/UX,
            calculations, and workflows, so expect frequent tweaks.
          </AlertDescription>
        </Alert>
        <Header />
        <StatsGrid
          summaries={summaries}
          totalPrincipal={totalPrincipal}
          currentMonthGross={currentMonthGross}
          currentMonthNet={currentMonthNet}
          currentMonthLabel={currentMonthLabel}
        />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 md:px-10">
        <section className="border-subtle bg-surface rounded-2xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Portfolio actions</h2>
              <p className="text-muted text-sm">
                Add new investments, switch modes, and preview net yield in real time.
              </p>
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
                  className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
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
            <EmptyState onSeed={seedDemoData} />
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <Tabs defaultValue="ladder">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="ladder">Timeline</TabsTrigger>
                    <TabsTrigger value="monthly">Cash Flow</TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMatured((current) => !current)}
                  >
                    {showMatured ? "Hide matured" : "Show matured"}
                  </Button>
                </div>
                <TabsContent value="ladder" className="mt-4">
                  <LadderTable
                    summaries={[...summaries, ...maturedSummaries]}
                    onEdit={handleEdit}
                    onDeleteRequest={(id) => setDeleteId(id)}
                    onMarkMatured={handleMarkMatured}
                  />
                </TabsContent>
                <TabsContent value="monthly" className="mt-4">
                  <MonthlyFlow items={monthlyAllowance} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>

        <section className="border-subtle bg-surface rounded-2xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Data Management</h2>
              <p className="text-muted text-sm">
                Local-only storage. No servers, no tracking.
              </p>
            </div>
            <span className="border-subtle bg-surface-soft text-muted rounded-lg border px-3 py-1 text-xs">
              Saved to Browser
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadBackup}>
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
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </Button>
            <Button
              variant="ghost"
              className="text-rose-700 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
              onClick={() => setDeposits([])}
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
          className="text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
          target="_blank"
          rel="noreferrer"
        >
          pbsabella
        </a>
      </footer>
    </div>
  );
}
