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
import { RouteGuard } from "@/components/layout/RouteGuard";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from "@/lib/domain/format";
import type { TimeDeposit } from "@/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { useCurrencyInput } from '@/components/ui/use-currency-input';
import { Container } from "@/components/layout/Container";
import { SettingRow } from "./SettingRow";

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
  const { deposits, importDeposits, clearDeposits, preferences, setPreference, isDemoMode, exitDemo } = usePortfolioContext();

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

  // Local string state bridges useCurrencyInput (string) ↔ draft (number | undefined)
  const [insuranceLimitStr, setInsuranceLimitStr] = useState(
    preferences.bankInsuranceLimit?.toString() ?? ""
  );
  const { ref: insuranceLimitRef, ...insuranceLimitInputProps } = useCurrencyInput({
    value: insuranceLimitStr,
    onChange: (raw) => {
      setInsuranceLimitStr(raw);
      setPreferencesDraft((prev) => ({ ...prev, bankInsuranceLimit: raw === "" ? undefined : Number(raw) }));
    },
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

  // ─── Exit demo ─────────────────────────────────────────────────────────────

  const handleExitDemo = useCallback(() => {
    exitDemo();
    router.push("/");
  }, [exitDemo, router]);

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
    <RouteGuard>
      <div className="bg-background">
        {/* Main content */}
        <main>
          <Container className="py-6 space-y-stack-lg">
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
              <CardContent className="space-y-stack-md">
                {/* Currency */}
                <SettingRow
                  label="Currency"
                  description="Changes how amounts are displayed. Does not convert your values: numbers stay the same."
                >
                  <Select
                    value={preferencesDraft.currency}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger aria-label="Display currency">
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
                </SettingRow>

                {/* Bank insurance limit */}
                <SettingRow
                  label="Deposit insurance limit"
                  description="Optional. Set to see exposure warnings per bank on the dashboard."
                  separator={false}
                >
                  <div className="shrink-0 flex items-center gap-2">
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>{getCurrencySymbol(preferencesDraft.currency)}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        ref={insuranceLimitRef}
                        className="w-36 text-sm"
                        placeholder="e.g. 500,000"
                        aria-label="Bank insurance limit amount"
                        {...insuranceLimitInputProps}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setInsuranceLimitStr("");
                            handleBankInsuranceLimitChange(undefined);
                          }}
                          aria-label="Clear insurance limit"
                        >
                          Clear
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </SettingRow>
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
              <CardContent className="space-y-stack-md">
                {/* Export */}
                <SettingRow
                  label="Export"
                  description={`Download a backup file with all ${deposits.length} deposit${deposits.length !== 1 ? "s" : ""}. Keep it somewhere safe.`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={deposits.length === 0 || isDemoMode}
                    className="shrink-0"
                  >
                    <Download className="size-4" />
                    Export JSON
                  </Button>
                </SettingRow>

                {/* Import */}
                <SettingRow
                  label="Import"
                  description="Restore from a previously exported backup. This replaces all current data."
                  note={importError && <p className="text-xs text-destructive mt-1">{importError}</p>}
                >
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
                      disabled={isDemoMode}
                    >
                      <Upload className="size-4" />
                      Import JSON
                    </Button>
                  </div>
                </SettingRow>

                {/* Clear */}
                <SettingRow
                  label="Clear all data"
                  description={`Permanently delete all ${deposits.length} deposit${deposits.length !== 1 ? "s" : ""} from this browser. Export a backup first.`}
                >
                  {isDemoMode ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExitDemo}
                      className="shrink-0"
                    >
                      Exit Demo
                    </Button>
                  ) : (
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
                  )}
                </SettingRow>



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
                    className="font-medium hover:underline text-accent-fg"
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
    </RouteGuard>
  );
}
