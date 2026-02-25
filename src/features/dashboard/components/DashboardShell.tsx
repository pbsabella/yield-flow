"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Info, LayoutList, Plus, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { InvestmentsTab } from "@/features/dashboard/components/InvestmentsTab";
import { CashFlowTab } from "@/features/dashboard/components/CashFlowTab";
import { EmptyLanding } from "@/features/dashboard/components/EmptyLanding";
import { DemoBanner } from "@/features/dashboard/components/DemoBanner";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import { usePortfolioData } from "@/features/dashboard/hooks/usePortfolioData";
import { InvestmentWizard } from "@/features/dashboard/components/wizard/InvestmentWizard";
import { deposits as demoDepositsData, banks as demoBanks } from "@/lib/data/demo";
import type { TimeDeposit } from "@/types";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export default function DashboardShell() {
  const { deposits: storedDeposits, setDeposits, isReady } = usePersistedDeposits();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeDeposit | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Demo mode — purely in-memory, never writes to localStorage
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [liveDemoDeposits, setLiveDemoDeposits] = useState<TimeDeposit[]>([]);

  const deposits = isDemoMode ? liveDemoDeposits : storedDeposits;
  const banks = isDemoMode ? [...demoBanks] : [];
  const showEmptyLanding = isReady && !isDemoMode && storedDeposits.length === 0;

  const existingBankNames = useMemo(
    () => [...new Set(deposits.map((d) => d.bankId))],
    [deposits],
  );

  const portfolio = usePortfolioData(deposits, banks);

  // ─── Demo mode entry / exit ─────────────────────────────────────────────────

  const handleEnterDemo = useCallback(() => {
    setIsDemoMode(true);
    setLiveDemoDeposits([...demoDepositsData]);
  }, []);

  const handleExitDemo = useCallback(() => {
    setIsDemoMode(false);
    setLiveDemoDeposits([]);
  }, []);

  // ─── Mutating handlers (demo-split) ────────────────────────────────────────

  const handleSettle = useCallback(
    (id: string) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "settled" as const } : d)),
        );
      } else {
        setDeposits(storedDeposits.map((d) => (d.id === id ? { ...d, status: "settled" as const } : d)));
      }
    },
    [isDemoMode, storedDeposits, setDeposits],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) => prev.filter((d) => d.id !== id));
      } else {
        setDeposits(storedDeposits.filter((d) => d.id !== id));
      }
    },
    [isDemoMode, storedDeposits, setDeposits],
  );

  const handleEdit = useCallback((deposit: TimeDeposit) => {
    setEditTarget(deposit);
    setWizardOpen(true);
  }, []);

  const handleSave = useCallback(
    (deposit: TimeDeposit) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) =>
          editTarget
            ? prev.map((d) => (d.id === deposit.id ? { ...deposit, status: editTarget.status } : d))
            : [...prev, deposit],
        );
      } else {
        setDeposits(
          editTarget
            ? storedDeposits.map((d) => (d.id === deposit.id ? { ...deposit, status: editTarget.status } : d))
            : [...storedDeposits, deposit],
        );
      }
      setHighlightedId(deposit.id);
      setTimeout(() => setHighlightedId(null), 2500);
    },
    [isDemoMode, storedDeposits, setDeposits, editTarget],
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="h-12 border-b border-border">
        <Container className="flex h-full items-center justify-between">
          <span className="text-primary dark:text-primary-subtle font-semibold tracking-tight">YieldFlow</span>
          <nav className="flex items-center gap-1">
            {!isDemoMode && (
              <Button variant="ghost" size="icon" asChild aria-label="Settings">
                <Link href="/settings">
                  <Settings className="size-4" />
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </nav>
        </Container>
      </header>

      {/* Demo banner — shown above main content */}
      {isDemoMode && <DemoBanner onExit={handleExitDemo} />}

      {/* Main content */}
      <main>
        <Container className="py-6 space-y-8">
          {!isReady && <DashboardSkeleton />}

          {showEmptyLanding && (
            <EmptyLanding
              onAddData={() => setWizardOpen(true)}
              onTryDemo={handleEnterDemo}
            />
          )}

          {isReady && !showEmptyLanding && (
            <>
              {/* Page intro */}
              <div>
                <h1 className="text-3xl font-semibold md:text-4xl mb-2">Yield Overview</h1>
                <p className="text-sm text-muted-foreground">
                  Track your fixed-income investments, visualize maturity timing, and see your passive income clearly.
                </p>
              </div>

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
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {portfolio.summaries.length} deposits tracked
                        </p>
                      </div>
                      <Button
                        size="default"
                        variant="default"
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
                        onEdit={handleEdit}
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
          )}
        </Container>
      </main>

      <InvestmentWizard
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) setEditTarget(null);
        }}
        onSave={handleSave}
        existingBankNames={existingBankNames}
        initialDeposit={editTarget ?? undefined}
      />
    </div>
  );
}
