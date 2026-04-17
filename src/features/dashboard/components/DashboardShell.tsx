"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { BankExposureCard } from "@/features/dashboard/components/BankExposureCard";
import { EmptyLanding } from "@/features/dashboard/components/EmptyLanding";
import { usePortfolioContext, useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { useWizardStore } from "@/store/wizardStore";
import { formatMonthLabel } from "@/lib/domain/date";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";

// ─── Quick cash flow preview for this month ────────────────────────────────────

type MonthEntry = {
  depositId: string;
  name: string;
  bankName: string;
  amountNet: number;
  payoutFrequency: string;
};

function ThisMonthPreview({ entries }: { entries: MonthEntry[] }) {
  const { fmtCurrency } = useFormatterContext();
  const monthLabel = formatMonthLabel(new Date());
  const preview = entries.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {monthLabel} payouts
          </CardTitle>
          <Button variant="ghost" asChild>
            <Link href="/cashflow">
              View all <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {preview.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts scheduled this month.</p>
        ) : (
          <div className="space-y-stack-xs">
            {preview.map((entry) => (
              <div
                key={entry.depositId}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">{entry.name || entry.bankName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{entry.bankName}</span>
                </div>
                <span className="font-medium tabular-nums text-accent-fg">
                  {fmtCurrency(entry.amountNet)}
                </span>
              </div>
            ))}
            {entries.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{entries.length - 3} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DashboardShell() {
  const { portfolio, status, enterDemo, importDeposits } = usePortfolioContext();
  const openWizard   = useWizardStore((s) => s.openWizard);
  const openExportAi = useWizardStore((s) => s.openExportAi);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (typeof raw !== "object" || raw === null || raw.version !== 1 || !Array.isArray(raw.deposits)) {
          throw new Error();
        }
        importDeposits(raw.deposits);
        toast.success(`${raw.deposits.length} investment${raw.deposits.length === 1 ? "" : "s"} imported`);
      } catch {
        toast.error("Import failed", { description: "The file doesn't appear to be a valid YieldFlow backup." });
      }
    };
    reader.readAsText(file);
  }, [importDeposits]);

  const thisMonthEntries = (portfolio.currentMonthFull?.entries ?? []) as MonthEntry[];

  return (
    <main>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
        aria-label="Import backup file"
      />
      <Container className="py-6 space-y-stack-xl">
        {status === "empty" && (
          <EmptyLanding
            onAddData={() => openWizard()}
            onTryDemo={enterDemo}
            onImport={() => fileInputRef.current?.click()}
          />
        )}

        {status === "ready" && (
          <>
            <PageHeader
              title="Portfolio"
              subtitle="Consolidated view of active yields"
              action={{ onClick: () => openWizard() }}
              secondaryAction={
                portfolio.summaries.length > 0
                  ? { label: "Export for AI", icon: <BrainCircuit className="size-4" />, onClick: openExportAi }
                  : undefined
              }
            />

            <KpiCards
              totalPrincipal={portfolio.totalPrincipal}
              currentMonthBreakdown={portfolio.currentMonthBreakdown}
              nextMaturity={portfolio.nextMaturity}
            />

            <ThisMonthPreview entries={thisMonthEntries} />

            <BankExposureCard />
          </>
        )}
      </Container>
    </main>
  );
}
