"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CashFlowTab } from "@/features/dashboard/components/CashFlowTab";
import { usePortfolioData } from "@/features/dashboard/hooks/usePortfolioData";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";

function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={["mx-auto w-full max-w-5xl px-4 sm:px-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function CashFlowSkeleton() {
  return (
    <div className="space-y-4">
      {/* Chart */}
      <Skeleton className="h-44 w-full" />
      {/* Month rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function CashFlowShell() {
  const { deposits, banks, openWizard, isReady } = usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

  return (
    <main>
      <Container className="py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">Cash Flow</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Interest projection by payout date
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

        {/* Chart + monthly breakdown */}
        {!isReady ? (
          <CashFlowSkeleton />
        ) : (
          <CashFlowTab
            monthlyAllowance={portfolio.monthlyAllowance}
            currentMonthFull={portfolio.currentMonthFull}
          />
        )}
      </Container>
    </main>
  );
}
