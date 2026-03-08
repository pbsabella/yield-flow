"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { InvestmentsView } from "./InvestmentsView";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrainCircuit } from "lucide-react";

export function InvestmentsShell() {
  const { portfolio, highlightedId, handleSettle, handleDelete, handleEdit, openWizard, openExportAi } =
    usePortfolioContext();

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-stack-lg">
          <PageHeader
            title="Investments"
            subtitle={
              portfolio.summaries.length > 0
                ? `${portfolio.summaries.length} deposit${portfolio.summaries.length !== 1 ? "s" : ""} tracked`
                : "No investments yet"
            }
            action={{ onClick: () => openWizard() }}
            secondaryAction={
              portfolio.summaries.length > 0
                ? { label: "Export for AI", icon: <BrainCircuit className="size-4" />, onClick: openExportAi }
                : undefined
            }
          />

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
