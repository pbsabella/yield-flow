"use client";

import { create } from "zustand";
import type { TimeDeposit } from "@/types";
import type { RolloverConfig } from "@/features/portfolio/context/PortfolioContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardStore {
  // ── State ──────────────────────────────────────────────────────────────────
  /** Whether the add/edit wizard modal is open. */
  wizardOpen: boolean;
  /** Deposit being edited. Null means a new deposit is being created. */
  editTarget: TimeDeposit | null;
  /** Pre-fill config when the wizard is opened for a rollover. */
  rolloverConfig: RolloverConfig | null;
  /** ID of the row to highlight after a mutation (auto-clears after 2.5s). */
  highlightedId: string | null;
  /** Whether the Export for AI dialog is open. */
  exportAiOpen: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Open the wizard for a new deposit, or pass an existing one to edit it. */
  openWizard: (target?: TimeDeposit) => void;
  /** Open the wizard pre-filled for a rollover. */
  openRollover: (config: RolloverConfig) => void;
  /** Close the wizard and reset all wizard state. */
  closeWizard: () => void;
  /** Highlight a row by ID, then clear it after 2.5 seconds. */
  highlight: (id: string) => void;
  /** Open the Export for AI dialog. */
  openExportAi: () => void;
  /** Close the Export for AI dialog. */
  closeExportAi: () => void;
}

// Module-level timer so it survives across React renders without needing a ref.
let highlightTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Store ────────────────────────────────────────────────────────────────────
//
// Zustand stores are module-level singletons — no <Provider> needed in layout.
// Each component subscribes to only the slice it needs via a selector function:
//
//   const wizardOpen = useWizardStore((s) => s.wizardOpen);
//
// Zustand compares the selector's return value before and after a state change.
// If the value didn't change, the component doesn't re-render. This means
// opening the wizard won't cause DashboardShell or CashFlowShell to re-render —
// they don't subscribe to wizardOpen.

export const useWizardStore = create<WizardStore>()((set) => ({
  // Initial state
  wizardOpen: false,
  editTarget: null,
  rolloverConfig: null,
  highlightedId: null,
  exportAiOpen: false,

  // Actions
  openWizard: (target) =>
    set({ wizardOpen: true, editTarget: target ?? null, rolloverConfig: null }),

  openRollover: (config) =>
    set({ wizardOpen: true, rolloverConfig: config, editTarget: null }),

  closeWizard: () =>
    set({ wizardOpen: false, editTarget: null, rolloverConfig: null }),

  highlight: (id) => {
    // Cancel any in-flight timer before starting a new one, so rapid successive
    // mutations don't race and cancel each other's highlight.
    if (highlightTimer) clearTimeout(highlightTimer);
    set({ highlightedId: id });
    highlightTimer = setTimeout(() => set({ highlightedId: null }), 2500);
  },

  openExportAi: () => set({ exportAiOpen: true }),
  closeExportAi: () => set({ exportAiOpen: false }),
}));
