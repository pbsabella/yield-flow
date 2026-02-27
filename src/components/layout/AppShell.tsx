"use client";

import { PrototypeBanner } from "@/components/layout/PrototypeBanner";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { DemoBanner } from "@/features/dashboard/components/DemoBanner";
import { InvestmentWizard } from "@/features/dashboard/components/wizard/InvestmentWizard";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    hasSidebar,
    isDemoMode,
    exitDemo,
    wizardOpen,
    editTarget,
    closeWizard,
    handleSave,
    existingBankNames,
  } = usePortfolioContext();

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* Global chrome — full-width, always on top */}
        <PrototypeBanner />
        {isDemoMode && <DemoBanner onExit={exitDemo} />}

        {hasSidebar ? (
          <div className="flex flex-1">
            {/* Desktop sidebar — sticky to page scroll, not a scroll container */}
            <aside className="hidden w-60 shrink-0 self-start sticky top-0 h-dvh overflow-hidden md:block">
              <SidebarNav />
            </aside>

            {/* Main content — let the page scroll so sticky works */}
            <div className="flex-1 min-w-0 pb-16 md:pb-0">
              {children}
            </div>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      {hasSidebar && <BottomTabBar />}

      {/* Investment wizard — always mounted, available from any page */}
      <InvestmentWizard
        open={wizardOpen}
        onOpenChange={(open) => { if (!open) closeWizard(); }}
        onSave={handleSave}
        existingBankNames={existingBankNames}
        initialDeposit={editTarget ?? undefined}
      />
    </>
  );
}
