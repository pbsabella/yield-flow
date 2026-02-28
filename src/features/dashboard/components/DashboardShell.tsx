"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCards } from "@/features/dashboard/components/KpiCards";
import { BankExposureCard } from "@/features/dashboard/components/BankExposureCard";
import { EmptyLanding } from "@/features/dashboard/components/EmptyLanding";
import { usePortfolioData } from "@/features/dashboard/hooks/usePortfolioData";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";
import { formatMonthLabel } from "@/lib/domain/date";

// ─── Layout helpers ────────────────────────────────────────────────────────────

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-5xl px-4 sm:px-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

// ─── Quick cash flow preview for this month ────────────────────────────────────

type MonthEntry = {
  depositId: string;
  name: string;
  bankName: string;
  amountNet: number;
  payoutFrequency: string;
};

function ThisMonthPreview({ entries }: { entries: MonthEntry[] }) {
  const { fmtCurrency } = usePortfolioContext();
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
          <div className="space-y-2">
            {preview.map((entry) => (
              <div
                key={entry.depositId}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">{entry.name || entry.bankName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{entry.bankName}</span>
                </div>
                <span className="font-medium tabular-nums text-pr dark:text-primary-subtle">
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
  const { deposits, banks, status, openWizard, enterDemo } = usePortfolioContext();

  const portfolio = usePortfolioData(deposits, banks);
  const thisMonthEntries = (portfolio.currentMonthFull?.entries ?? []) as MonthEntry[];

  return (
    <main>
      <Container className="py-6 space-y-8">
        {status === "empty" && (
          <EmptyLanding
            onAddData={() => openWizard()}
            onTryDemo={enterDemo}
          />
        )}

        {status === "ready" && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold md:text-3xl">Portfolio</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Consolidated view of active yields
                </p>
              </div>
              <Button
                onClick={() => openWizard()}
                className="hidden md:flex shrink-0"
              >
                <Plus className="size-4" />
                Add investment
              </Button>
            </div>

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
