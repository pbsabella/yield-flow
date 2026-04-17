"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { InvestmentsView } from "./InvestmentsView";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { useWizardStore } from "@/store/wizardStore";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrainCircuit } from "lucide-react";

export function InvestmentsShell() {
  const { portfolio, handleSettle, handleUnsettle, handleClose, handleReopen, handleDelete, handleEdit } = usePortfolioContext();

  // UI state from the store — only re-renders when these specific slices change.
  const highlightedId = useWizardStore((s) => s.highlightedId);
  const openWizard    = useWizardStore((s) => s.openWizard);
  const openRollover  = useWizardStore((s) => s.openRollover);
  const openExportAi  = useWizardStore((s) => s.openExportAi);

  return (
    <RouteGuard>
      <main>
        <Container className="py-6 space-y-stack-lg">
          <PageHeader
            title="Investments"
            subtitle={(() => {
              const total = portfolio.summaries.length;
              if (total === 0) return "No investments yet";
              const active = portfolio.summaries.filter(
                (s) => s.effectiveStatus === "active" || s.effectiveStatus === "matured",
              ).length;
              return active > 0 && active < total
                ? `${active} active · ${total} total`
                : `${total} deposit${total !== 1 ? "s" : ""} tracked`;
            })()}
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
            onUnsettle={handleUnsettle}
            onClose={handleClose}
            onReopen={handleReopen}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRollOver={openRollover}
            highlightedId={highlightedId}
          />
        </Container>
      </main>
    </RouteGuard>
  );
}
