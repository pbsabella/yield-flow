"use client";

import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
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
  const { deposits: storedDeposits, isReady } = usePersistedDeposits();

  // In development with no stored data, seed the UI with demo deposits so
  // every section renders meaningfully without manual data entry.
  const usingDemo = isDev && storedDeposits.length === 0;
  const deposits = usingDemo ? demoDeposits : storedDeposits;
  const banks = usingDemo
    ? [...demoBanks]
    : [...bankTemplates];

  const portfolio = usePortfolioData(deposits, banks);

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 h-14 border-b border-border bg-background/80 backdrop-blur-sm">
        <Container className="flex h-full items-center justify-between">
          <span className="text-primary font-semibold tracking-tight">YieldFlow</span>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" disabled={!isReady}>
              Add Investment
            </Button>
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
                  <CardContent className="pt-4 pb-0">
                    <TabsList>
                      <TabsTrigger value="investments">Investments</TabsTrigger>
                      <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
                    </TabsList>
                  </CardContent>

                  <TabsContent value="investments">
                    <CardContent className="pt-4 pb-6">
                      {deposits.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                          <p className="text-sm text-muted-foreground">No investments yet.</p>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            Add your first time deposit or savings account to start tracking your
                            yield ladder.
                          </p>
                          <Button size="sm" className="mt-1">
                            Add Investment
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {/* InvestmentsPanel — Phase 3 */}
                          Timeline coming soon ({deposits.length} investments)
                        </p>
                      )}
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
