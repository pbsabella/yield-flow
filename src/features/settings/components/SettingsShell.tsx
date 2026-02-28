"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Trash2, Upload } from "lucide-react";
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
import { toast } from "sonner"
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner"
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";
import { SUPPORTED_CURRENCIES } from "@/lib/domain/format";
import type { TimeDeposit } from "@/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-5xl px-4 sm:px-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

// ─── Import validation ────────────────────────────────────────────────────────

type BackupFile = {
  version: number;
  exportedAt: string;
  deposits: TimeDeposit[];
};

const REQUIRED_DEPOSIT_FIELDS: (keyof TimeDeposit)[] = [
  "id",
  "bankId",
  "name",
  "principal",
  "startDate",
  "termMonths",
  "flatRate",
  "tiers",
  "payoutFrequency",
  "status",
];

function validateBackup(raw: unknown): TimeDeposit[] {
  if (typeof raw !== "object" || raw === null) throw new Error("Invalid file format.");
  const payload = raw as Record<string, unknown>;
  if (payload.version !== 1) throw new Error("Unsupported backup version.");
  if (!Array.isArray(payload.deposits)) throw new Error("No deposits array found.");
  for (const d of payload.deposits as unknown[]) {
    if (typeof d !== "object" || d === null) throw new Error("Invalid deposit entry.");
    for (const field of REQUIRED_DEPOSIT_FIELDS) {
      if (!(field in (d as object))) throw new Error(`Deposit missing required field: ${field}.`);
    }
  }
  return (payload as BackupFile).deposits;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsShell() {
  const router = useRouter();
  const { deposits, importDeposits, clearDeposits, preferences, setPreference } = usePortfolioContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<TimeDeposit[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [caveatsOpen, setCaveatsOpen] = useState(false);

  const [preferencesDraft, setPreferencesDraft] = useState({
    currency: preferences.currency,
    bankInsuranceLimit: preferences.bankInsuranceLimit,
  });

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      deposits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yieldflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [deposits]);

  // ─── Import ────────────────────────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const parsed = validateBackup(raw);
        setImportPreview(parsed);
        setImportConfirmOpen(true);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to read file.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  }, []);

  const handleImportConfirm = useCallback(() => {
    if (!importPreview) return;
    importDeposits(importPreview);
    setImportPreview(null);
    setImportConfirmOpen(false);
    router.push("/");
  }, [importPreview, importDeposits, router]);

  // ─── Clear ─────────────────────────────────────────────────────────────────

  const handleClearConfirm = useCallback(() => {
    clearDeposits();
    setClearConfirmOpen(false);
    router.push("/");
  }, [clearDeposits, router]);

  // ─── Currency change ───────────────────────────────────────────────────────
  const handleCurrencyChange = (value: string) => {
    setPreferencesDraft((prev) => ({ ...prev, currency: value }));
  };

  // ─── Deposit insurance limit ───────────────────────────────────────────────
  const handleBankInsuranceLimitChange = (value?: number) => {
    setPreferencesDraft((prev) => ({ ...prev, bankInsuranceLimit: value }));
  };

  const handleSavePreferences = () => {
    // Sync draft back to the global context hook
    setPreference("currency", preferencesDraft.currency);
    setPreference("bankInsuranceLimit", preferencesDraft.bankInsuranceLimit);

    toast.success("Settings saved", {
      description: "Preferences have been updated locally in this browser."
    });
  }

  return (
    <div className="bg-background">
      {/* Main content */}
      <main>
        <Container className="py-6 space-y-6">
          <h1 className="text-2xl font-semibold md:text-3xl">Settings</h1>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how YieldFlow looks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Switch between light and dark mode.
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Preferences card */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardAction>
                <Button size="sm" onClick={handleSavePreferences}>Save changes</Button>
              </CardAction>
              <CardDescription>Display settings for your portfolio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currency */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Changes how amounts are displayed. Does not convert your values: numbers stay the same.
                  </p>
                </div>
                <Select
                  value={preferencesDraft.currency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger
                    aria-label="Display currency"
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border" />

              {/* Bank insurance limit */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Deposit insurance limit</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional. Set to see exposure warnings per bank on the dashboard.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {/* TODO: Format currency */}
                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      min={0}
                      className="w-36 text-sm"
                      placeholder="e.g. 500000"
                      value={preferencesDraft.bankInsuranceLimit ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        handleBankInsuranceLimitChange(val);
                      }}
                      aria-label="Bank insurance limit amount"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        variant="ghost"
                        size="xs"
                        disabled={preferences.bankInsuranceLimit === null}
                        onClick={() => handleBankInsuranceLimitChange(undefined)}
                        aria-label="Clear insurance limit"
                      >
                        Clear
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data management card */}
          <Card>
            <CardHeader>
              <CardTitle>Data management</CardTitle>
              <CardDescription>
                Your investments are stored locally in this browser; no servers, no accounts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Export</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download a backup file with all {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}.
                    Keep it somewhere safe.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={deposits.length === 0}
                  className="shrink-0"
                >
                  <Download className="size-4" />
                  Export JSON
                </Button>
              </div>

              <div className="border-t border-border" />

              {/* Import */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Import</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Restore from a previously exported backup. This replaces all current data.
                  </p>
                  {importError && (
                    <p className="text-xs text-destructive mt-1">{importError}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Import backup file"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    Import JSON
                  </Button>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Clear */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Clear all data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete all {deposits.length} deposit{deposits.length !== 1 ? "s" : ""} from this browser.
                    Export a backup first.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setClearConfirmOpen(true)}
                  disabled={deposits.length === 0}
                  className="shrink-0"
                >
                  <Trash2 className="size-4" />
                  Clear all
                </Button>
              </div>

              <Separator />



              {/* Caveats */}
              <Collapsible open={caveatsOpen} onOpenChange={setCaveatsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm font-medium transition-colors py-1">
                    <ChevronDown
                      className={["size-4 transition-transform", caveatsOpen ? "rotate-180" : ""].filter(Boolean).join(" ")}
                      aria-hidden="true"
                    />
                    What you should know about local storage
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside pl-1">
                    <li>
                      Your data is stored <strong className="text-foreground font-medium">unencrypted</strong> — browser extensions running on this site can read it.
                    </li>
                    <li>Data is not synced between devices or browsers.</li>
                    <li>Clearing your browser history or site data will erase all investments.</li>
                    <li>
                      Exported files contain sensitive financial data — store them securely, like you would a document with bank details.
                    </li>
                    <li>Not recommended on shared or public computers.</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* About */}
          <div className="text-xs text-muted-foreground mt-2 text-center">
            <div className="mb-1">
              <span>
                YieldFlow Beta by{' '}
                <a
                  href="https://pbsabella.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-medium hover:underline dark:text-primary-subtle"
                >
                  pbsabella
                </a>
              </span>
            </div>
            <div className="flex gap-1 justify-center">
              <a
                href="https://github.com/pbsabella/yield-flow"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                View source
              </a>
              <span className="text-foreground">·</span>
              <a
                href="https://github.com/pbsabella/yield-flow/issues"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Feedback
              </a>
            </div>
          </div>
        </Container>
        <Toaster />
      </main>

      {/* Import confirmation */}
      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your {deposits.length} current deposit{deposits.length !== 1 ? "s" : ""} with {importPreview?.length ?? 0} imported deposit{(importPreview?.length ?? 0) !== 1 ? "s" : ""}.
              This cannot be undone. Export a backup first if you want to keep your current data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setImportPreview(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear confirmation */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {deposits.length} deposit{deposits.length !== 1 ? "s" : ""} from this browser.
              Export a backup before clearing if you want to keep your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleClearConfirm}>
              Clear all data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
