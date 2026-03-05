"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { InvestmentsView } from "./InvestmentsView";
import { usePortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";

export function InvestmentsShell() {
  const { deposits, banks, highlightedId, handleSettle, handleDelete, handleEdit, openWizard } =
    usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

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
