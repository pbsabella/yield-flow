"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestmentsTab } from "@/features/dashboard/components/InvestmentsTab";
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

function InvestmentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex gap-4">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-36" />
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Skeleton className="h-11 w-full rounded-none rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t last:rounded-b-lg" />
        ))}
      </div>
    </div>
  );
}

export function InvestmentsShell() {
  const { deposits, banks, highlightedId, handleSettle, handleDelete, handleEdit, openWizard, isReady } =
    usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

  return (
    <main>
      <Container className="py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">Investments</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {!isReady
                ? <Skeleton className="h-4 w-32 inline-block" />
                : portfolio.summaries.length > 0
                  ? `${portfolio.summaries.length} deposit${portfolio.summaries.length !== 1 ? "s" : ""} tracked`
                  : "No investments yet"}
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

        {/* Table / card list */}
        {!isReady ? (
          <InvestmentsSkeleton />
        ) : (
          <InvestmentsTab
            summaries={portfolio.summaries}
            onSettle={handleSettle}
            onDelete={handleDelete}
            onEdit={handleEdit}
            highlightedId={highlightedId}
          />
        )}
      </Container>
    </main>
  );
}
