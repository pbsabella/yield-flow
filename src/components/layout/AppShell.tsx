"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PrototypeBanner } from "@/components/layout/PrototypeBanner";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { InvestmentWizard } from "@/features/portfolio/components/wizard/InvestmentWizard";
import { ExportAiDialog } from "@/features/investments/components/ExportAiDialog";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    status,
    hasSidebar,
    isDemoMode,
    exitDemo,
    wizardOpen,
    editTarget,
    closeWizard,
    handleSave,
    existingBankNames,
    exportAiOpen,
    closeExportAi,
    portfolio,
    preferences,
  } = usePortfolioContext();

  const handleExitDemo = useCallback(() => {
    exitDemo();
    router.push("/");
  }, [exitDemo, router]);

  if (status === "booting") {
    return <SplashScreen />;
  }

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* Global chrome — full-width, always on top */}
        <header role="banner">
          <PrototypeBanner />
          {isDemoMode && (
            <div role="status" aria-live="polite">
              <DemoBanner onExit={handleExitDemo} />
            </div>
          )}
        </header>

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
          <div className="flex-1">{children}</div>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      {hasSidebar && <BottomTabBar />}

      {/* Global toast — one instance covers all pages */}
      <Toaster />

      {/* Investment wizard — only mounted when open to avoid idle re-renders */}
      {wizardOpen && (
        <InvestmentWizard
          open={wizardOpen}
          onOpenChange={(open) => { if (!open) closeWizard(); }}
          onSave={handleSave}
          existingBankNames={existingBankNames}
          initialDeposit={editTarget ?? undefined}
        />
      )}

      {/* Export for AI dialog — global single instance, triggered from any page */}
      {exportAiOpen && (
        <ExportAiDialog
          open={exportAiOpen}
          onOpenChange={(open) => { if (!open) closeExportAi(); }}
          summaries={portfolio.summaries}
          monthlyAllowance={portfolio.monthlyAllowance}
          preferences={preferences}
        />
      )}
    </>
  );
}
