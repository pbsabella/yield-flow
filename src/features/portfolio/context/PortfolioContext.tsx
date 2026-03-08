"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePersistedDeposits } from "@/lib/hooks/usePersistedDeposits";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { formatCurrency, getCurrencySymbol } from "@/lib/domain/format";
import { deposits as demoDepositsData, banks as demoBanks } from "@/lib/data/demo";
import { usePortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import type { PortfolioData } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit, Bank } from "@/types";
import type { Preferences } from "@/lib/hooks/usePreferences";

// ─── Formatter context (stable — only invalidates on currency pref change) ─────

interface PortfolioFormatterContextValue {
  /** Pre-bound currency formatter. Uses the user's currency preference. Vanity only — does not convert values. */
  fmtCurrency: (value: number) => string;
  /** Currency symbol for input addons (e.g. "₱", "$"). */
  currencySymbol: string;
}

const PortfolioFormatterContext = createContext<PortfolioFormatterContextValue | null>(null);

export function useFormatterContext() {
  const ctx = useContext(PortfolioFormatterContext);
  if (!ctx) throw new Error("useFormatterContext must be used within PortfolioProvider");
  return ctx;
}

// ─── Context shape ─────────────────────────────────────────────────────────────

export type AppStatus = "booting" | "empty" | "ready";

interface PortfolioContextValue {
  // Data
  deposits: TimeDeposit[];
  banks: Bank[];
  isReady: boolean;
  isDemoMode: boolean;
  status: AppStatus;
  existingBankNames: string[];
  hasSidebar: boolean;

  // Preferences
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;

  // Wizard state
  wizardOpen: boolean;
  editTarget: TimeDeposit | null;
  highlightedId: string | null;

  // Export-for-AI dialog state (distinct from the JSON data export in Settings)
  exportAiOpen: boolean;
  openExportAi: () => void;
  closeExportAi: () => void;

  // Demo handlers
  enterDemo: () => void;
  exitDemo: () => void;

  // Investment handlers
  openWizard: (target?: TimeDeposit) => void;
  closeWizard: () => void;
  handleSave: (deposit: TimeDeposit) => void;
  handleSettle: (id: string) => void;
  handleDelete: (id: string) => void;
  handleEdit: (deposit: TimeDeposit) => void;

  // Data management (used by Settings)
  importDeposits: (deposits: TimeDeposit[]) => void;
  clearDeposits: () => void;

  // Computed portfolio data (derived from deposits + banks, computed once here)
  portfolio: PortfolioData;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function usePortfolioContext() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolioContext must be used within PortfolioProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { deposits: storedDeposits, setDeposits, isReady: depositsReady, remove } = usePersistedDeposits();
  const {
    value: isDemoMode,
    setValue: setIsDemoMode,
    isReady: demoReady,
  } = useLocalStorage<boolean>("yf:demo-mode", false, { skipInitialWrite: true });
  const { preferences, setPreference } = usePreferences();

  const fmtCurrency = useCallback(
    (value: number) => formatCurrency(value, preferences.currency),
    [preferences.currency],
  );
  const currencySymbol = useMemo(
    () => getCurrencySymbol(preferences.currency),
    [preferences.currency],
  );

  const isReady = depositsReady && demoReady;

  const [liveDemoDeposits, setLiveDemoDeposits] = useState<TimeDeposit[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeDeposit | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [exportAiOpen, setExportAiOpen] = useState(false);

  // When demo mode is restored from persisted storage, re-populate demo deposits.
  // setState inside an effect is intentional here: we're syncing React state from
  // an external source (localStorage via isDemoMode) on hydration — not a loop risk.
  useEffect(() => {
    if (isDemoMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiveDemoDeposits((prev) => (prev.length === 0 ? [...demoDepositsData] : prev));
    }
  }, [isDemoMode]);

  const deposits = isDemoMode ? liveDemoDeposits : storedDeposits;
  // Memoized so usePortfolioData sees a stable reference and doesn't recompute on every render.
  const banks = useMemo<Bank[]>(() => (isDemoMode ? [...demoBanks] : []), [isDemoMode]);

  const status: AppStatus = !isReady
    ? "booting"
    : isDemoMode || storedDeposits.length > 0
      ? "ready"
      : "empty";

  const hasSidebar = status === "ready";

  const existingBankNames = useMemo(
    () => [...new Set(deposits.map((d) => d.bankId))],
    [deposits],
  );

  // Computed once here so all shells (Dashboard, Investments, CashFlow) read from
  // context instead of each calling usePortfolioData independently.
  const portfolio = usePortfolioData(deposits, banks);

  // ─── Demo ──────────────────────────────────────────────────────────────────

  const enterDemo = useCallback(() => {
    setIsDemoMode(true);
    setLiveDemoDeposits([...demoDepositsData]);
  }, [setIsDemoMode]);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setLiveDemoDeposits([]);
  }, [setIsDemoMode]);

  // ─── Export ────────────────────────────────────────────────────────────────

  const openExportAi = useCallback(() => setExportAiOpen(true), []);
  const closeExportAi = useCallback(() => setExportAiOpen(false), []);

  // ─── Wizard ────────────────────────────────────────────────────────────────

  const openWizard = useCallback((target?: TimeDeposit) => {
    setEditTarget(target ?? null);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    setEditTarget(null);
  }, []);

  // ─── Deposit mutations ─────────────────────────────────────────────────────

  const handleSave = useCallback(
    (deposit: TimeDeposit) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) =>
          editTarget
            ? prev.map((d) => (d.id === deposit.id ? { ...deposit, status: editTarget.status } : d))
            : [...prev, deposit],
        );
      } else {
        setDeposits(
          editTarget
            ? storedDeposits.map((d) => (d.id === deposit.id ? { ...deposit, status: editTarget.status } : d))
            : [...storedDeposits, deposit],
        );
      }
      setHighlightedId(deposit.id);
      setTimeout(() => setHighlightedId(null), 2500);
    },
    [isDemoMode, storedDeposits, setDeposits, editTarget],
  );

  const handleSettle = useCallback(
    (id: string) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: "settled" as const } : d)),
        );
      } else {
        setDeposits(storedDeposits.map((d) => (d.id === id ? { ...d, status: "settled" as const } : d)));
      }
    },
    [isDemoMode, storedDeposits, setDeposits],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (isDemoMode) {
        setLiveDemoDeposits((prev) => prev.filter((d) => d.id !== id));
      } else {
        setDeposits(storedDeposits.filter((d) => d.id !== id));
      }
    },
    [isDemoMode, storedDeposits, setDeposits],
  );

  const handleEdit = useCallback(
    (deposit: TimeDeposit) => {
      openWizard(deposit);
    },
    [openWizard],
  );

  // ─── Data management ───────────────────────────────────────────────────────

  const importDeposits = useCallback(
    (incoming: TimeDeposit[]) => {
      setDeposits(incoming);
    },
    [setDeposits],
  );

  const clearDeposits = useCallback(() => {
    remove();
    setDeposits([]);
  }, [remove, setDeposits]);

  // Formatter context: isolated so currency-formatting consumers don't re-render
  // on wizard/highlight state changes. Only invalidates when currency pref changes.
  const formatterValue = useMemo<PortfolioFormatterContextValue>(
    () => ({ fmtCurrency, currencySymbol }),
    [fmtCurrency, currencySymbol],
  );

  // useMemo ensures a new context value object is only created when something
  // actually changed. Without this, a new object is created every render and
  // every component calling usePortfolioContext() re-renders unnecessarily.
  const value = useMemo<PortfolioContextValue>(
    () => ({
      deposits,
      banks,
      isReady,
      isDemoMode,
      status,
      existingBankNames,
      hasSidebar,
      preferences,
      setPreference,
      wizardOpen,
      editTarget,
      highlightedId,
      exportAiOpen,
      openExportAi,
      closeExportAi,
      enterDemo,
      exitDemo,
      openWizard,
      closeWizard,
      handleSave,
      handleSettle,
      handleDelete,
      handleEdit,
      importDeposits,
      clearDeposits,
      portfolio,
    }),
    [
      deposits,
      banks,
      isReady,
      isDemoMode,
      status,
      existingBankNames,
      hasSidebar,
      preferences,
      setPreference,
      wizardOpen,
      editTarget,
      highlightedId,
      exportAiOpen,
      openExportAi,
      closeExportAi,
      enterDemo,
      exitDemo,
      openWizard,
      closeWizard,
      handleSave,
      handleSettle,
      handleDelete,
      handleEdit,
      importDeposits,
      clearDeposits,
      portfolio,
    ],
  );

  return (
    <PortfolioFormatterContext.Provider value={formatterValue}>
      <PortfolioContext.Provider value={value}>
        {children}
      </PortfolioContext.Provider>
    </PortfolioFormatterContext.Provider>
  );
}
