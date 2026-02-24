"use client";

import { useCallback } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { InvestmentsTab } from "@/features/dashboard/components/InvestmentsTab";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import { usePortfolioData } from "@/features/dashboard/hooks/usePortfolioData";
import { bankTemplates } from "@/lib/data/banks-config";
import { deposits as demoDeposits, banks as demoBanks } from "@/lib/data/demo";

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

  // In development with no stored data, seed the UI with demo deposits so
  // every section renders meaningfully without manual data entry.
  const usingDemo = isDev && storedDeposits.length === 0;
  const deposits = usingDemo ? demoDeposits : storedDeposits;
  const banks = usingDemo ? [...demoBanks] : [...bankTemplates];

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
          {/* WIP alert */}
          <Alert>
            <Info />
            <AlertTitle>Work in progress</AlertTitle>
            <AlertDescription>
              YieldFlow is actively being developed. Your data is stored locally in this browser.
            </AlertDescription>
          </Alert>

          {/* Page intro */}
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
              <Card>
                <Tabs defaultValue="investments">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-3xl font-semibold">Portfolio</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {portfolio.summaries.length} deposits tracked
                        </p>
                      </div>
                      <Button size="sm" variant="default" disabled={!isReady}>
                        Add investment
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 pb-2">
                    <TabsList>
                      <TabsTrigger value="investments">Investments</TabsTrigger>
                      <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                    </TabsList>
                  </CardContent>

                  <TabsContent value="investments">
                    <CardContent className="pt-4 pb-6">
                      <InvestmentsTab
                        summaries={portfolio.summaries}
                        onSettle={handleSettle}
                        onDelete={handleDelete}
                      />
                    </CardContent>
                  </TabsContent>

                  <TabsContent value="cashflow">
                    <CardContent className="pt-4 pb-6">
                      <p className="text-sm text-muted-foreground">
                        {/* CashFlowPanel — Phase 4 */}
                        12-month cash flow coming soon
                      </p>
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
    </div>
  );
}
