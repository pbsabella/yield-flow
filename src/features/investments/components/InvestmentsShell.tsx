"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { InvestmentsView } from "./InvestmentsView";
import { usePortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Container } from "@/components/layout/Container";

export function InvestmentsShell() {
  const { deposits, banks, highlightedId, handleSettle, handleDelete, handleEdit, openWizard } =
    usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-stack-lg">
          <div className="flex items-start justify-between gap-stack-md">
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

          <InvestmentsView
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
