"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { CashFlowView } from "./CashFlowView";
import { usePortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Container } from "@/components/layout/Container";

export function CashFlowShell() {
  const { deposits, banks, openWizard } = usePortfolioContext();
  const portfolio = usePortfolioData(deposits, banks);

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-stack-lg">
          <div className="flex items-start justify-between gap-stack-md">
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

          <CashFlowView
            monthlyAllowance={portfolio.monthlyAllowance}
            currentMonthFull={portfolio.currentMonthFull}
          />
        </Container>
      </main>
    </RouteGuard>
  );
}
