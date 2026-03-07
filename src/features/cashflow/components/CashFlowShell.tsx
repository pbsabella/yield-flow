"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { CashFlowView } from "./CashFlowView";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";

export function CashFlowShell() {
  const { portfolio, openWizard } = usePortfolioContext();

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-stack-lg">
          <PageHeader
            title="Cash Flow"
            subtitle="Interest projection by payout date"
            action={{ onClick: () => openWizard() }}
          />

          <CashFlowView
            monthlyAllowance={portfolio.monthlyAllowance}
            currentMonthFull={portfolio.currentMonthFull}
          />
        </Container>
      </main>
    </RouteGuard>
  );
}
