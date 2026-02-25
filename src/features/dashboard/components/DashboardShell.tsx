"use client";

import { useCallback, useMemo, useState } from "react";
import { Info, LayoutList, Plus, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { InvestmentsTab } from "@/features/dashboard/components/InvestmentsTab";
import { CashFlowTab } from "@/features/dashboard/components/CashFlowTab";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import { usePortfolioData } from "@/features/dashboard/hooks/usePortfolioData";
import { InvestmentWizard } from "@/features/dashboard/components/wizard/InvestmentWizard";
import { deposits as demoDeposits, banks as demoBanks } from "@/lib/data/demo";
import type { TimeDeposit } from "@/types";

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-5xl px-4 sm:px-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-14 mb-2 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === "development";

export default function DashboardShell() {
  const { deposits: storedDeposits, setDeposits, isReady } = usePersistedDeposits();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // In development with no stored data, seed the UI with demo deposits so
  // every section renders meaningfully without manual data entry.
  const usingDemo = isDev && storedDeposits.length === 0;
  const deposits = usingDemo ? demoDeposits : storedDeposits;
  const banks = usingDemo ? [...demoBanks] : [];

  const existingBankNames = useMemo(
    () => [...new Set(deposits.map((d) => d.bankId))],
    [deposits],
  );

  const portfolio = usePortfolioData(deposits, banks);

  const handleSettle = useCallback(
    (id: string) => {
      const base = usingDemo ? demoDeposits : storedDeposits;
      setDeposits(base.map((d) => (d.id === id ? { ...d, status: "settled" as const } : d)));
    },
    [usingDemo, storedDeposits, setDeposits],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const base = usingDemo ? demoDeposits : storedDeposits;
      setDeposits(base.filter((d) => d.id !== id));
    },
    [usingDemo, storedDeposits, setDeposits],
  );

  const handleSave = useCallback(
    (deposit: TimeDeposit) => {
      const base = usingDemo ? demoDeposits : storedDeposits;
      setDeposits([...base, deposit]);
      setHighlightedId(deposit.id);
      setTimeout(() => setHighlightedId(null), 2500);
    },
    [usingDemo, storedDeposits, setDeposits],
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border ">
        <Container className="flex h-full items-center justify-between">
          <span className="text-primary dark:text-primary-subtle font-semibold tracking-tight">YieldFlow</span>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
          </nav>
        </Container>
      </header>

      {/* Main content */}
      <main>
        <Container className="py-6 space-y-8">
          <Alert>
            <Info />
            <AlertTitle>Stored on this device</AlertTitle>
            <AlertDescription>
              Your data never leaves this device — no servers, no accounts. It&apos;s stored in your browser like a local file, so keep backups using the download option below. Not recommended on shared or public computers.
            </AlertDescription>
          </Alert>

          {/* Page intro */}
          <h1 className="text-3xl font-semibold md:text-4xl mb-2">Yield Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track your fixed-income investments, visualize maturity timing, and see your passive income clearly.
          </p>

          {isReady ? (
            <>
              {/* KPI cards */}
              <KpiCards
                totalPrincipal={portfolio.totalPrincipal}
                currentMonthBreakdown={portfolio.currentMonthBreakdown}
                nextMaturity={portfolio.nextMaturity}
              />

              {/* Investments + Cash Flow in a single tabbed card */}
              <Card className="pt-8">
                <Tabs defaultValue="investments">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-3xl font-semibold"><h2>Portfolio</h2></CardTitle>
                        {/* TODO: Make this X active deposits */}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {portfolio.summaries.length} deposits tracked
                        </p>
                      </div>
                      <Button
                        size="default"
                        variant="default"
                        disabled={!isReady}
                        onClick={() => setWizardOpen(true)}
                      >
                        <Plus />
                        Add investment
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 pb-2">
                    <TabsList>
                      <TabsTrigger value="investments">
                        <LayoutList className="size-4" />
                        Investments
                      </TabsTrigger>
                      <TabsTrigger value="cashflow">
                        <TrendingUp className="size-4" />
                        Cash Flow
                      </TabsTrigger>
                    </TabsList>
                  </CardContent>

                  <TabsContent value="investments" tabIndex={-1}>
                    <CardContent className="pt-4 pb-6">
                      <InvestmentsTab
                        summaries={portfolio.summaries}
                        onSettle={handleSettle}
                        onDelete={handleDelete}
                        highlightedId={highlightedId}
                      />
                    </CardContent>
                  </TabsContent>

                  <TabsContent value="cashflow" tabIndex={-1}>
                    <CardContent className="pt-4 pb-6">
                      <CashFlowTab
                        monthlyAllowance={portfolio.monthlyAllowance}
                        currentMonthFull={portfolio.currentMonthFull}
                      />
                    </CardContent>
                  </TabsContent>
                </Tabs>
              </Card>
            </>
          ) : (
            <DashboardSkeleton />
          )}
        </Container>
      </main>

      <InvestmentWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSave={handleSave}
        existingBankNames={existingBankNames}
      />
    </div>
  );
}
