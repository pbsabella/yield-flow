"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/layout/RouteGuard";
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

export function InvestmentsShell() {
  const { deposits, banks, highlightedId, handleSettle, handleDelete, handleEdit, openWizard } =
    usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Investments</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {portfolio.summaries.length > 0
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

          <InvestmentsTab
            summaries={portfolio.summaries}
            onSettle={handleSettle}
            onDelete={handleDelete}
            onEdit={handleEdit}
            highlightedId={highlightedId}
          />
        </Container>
      </main>
    </RouteGuard>
  );
}
