"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Download, Trash2, Upload } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import type { TimeDeposit } from "@/types";

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-2xl px-4 sm:px-6", className].filter(Boolean).join(" ")}
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
  const { deposits, setDeposits, remove } = usePersistedDeposits();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<TimeDeposit[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [caveatsOpen, setCaveatsOpen] = useState(false);

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
    setDeposits(importPreview);
    setImportPreview(null);
    setImportConfirmOpen(false);
    router.push("/");
  }, [importPreview, setDeposits, router]);

  // ─── Clear ─────────────────────────────────────────────────────────────────

  const handleClearConfirm = useCallback(() => {
    remove();
    setDeposits([]);
    setClearConfirmOpen(false);
    router.push("/");
  }, [remove, setDeposits, router]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border">
        <Container className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5 text-sm">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
            </Button>
          </div>
          <span className="text-primary dark:text-primary-subtle font-semibold tracking-tight">YieldFlow</span>
          <ThemeToggle />
        </Container>
      </header>

      {/* Main content */}
      <main>
        <Container className="py-8 space-y-6">
          <h1 className="text-2xl font-semibold">Settings</h1>

          {/* Data management card */}
          <Card>
            <CardHeader>
              <CardTitle>Data management</CardTitle>
              <CardDescription>
                Your investments are stored locally in this browser — no servers, no accounts.
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
            </CardContent>
          </Card>

          {/* Caveats */}
          <Collapsible open={caveatsOpen} onOpenChange={setCaveatsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              Replace {importPreview?.length ?? 0} deposit{(importPreview?.length ?? 0) !== 1 ? "s" : ""}
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
