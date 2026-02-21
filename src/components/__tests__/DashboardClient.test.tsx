import { fireEvent, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import DashboardClient from "@/components/DashboardClient";
import { banks as demoBanks, deposits as demoDeposits } from "@/lib/demo";
import { renderWithProviders } from "@/components/__tests__/test-utils";
import { buildDepositSummary } from "@/lib/domain/interest";
import { formatDate, formatMonthLabel, monthKey } from "@/lib/domain/date";
import { vi } from "vitest";

vi.mock("@/components/dashboard/DepositFormDialog", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/components/dashboard/ConfirmDeleteDialog", () => ({
  default: () => null,
}));

describe("DashboardClient", () => {
  const toRegExp = (value: string) =>
    new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders header and primary actions", async () => {
    localStorage.setItem("yieldflow-deposits", JSON.stringify(demoDeposits));
    renderWithProviders(<DashboardClient />);

    expect(
      await screen.findByRole("heading", { name: /yieldflow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /track your fixed-income investments, visualize maturity timing, and see your passive income clearly\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add investment/i })).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cash flow/i })).toBeInTheDocument();
  }, 10000);

  it("shows empty state with privacy notice", () => {
    renderWithProviders(<DashboardClient />);

    expect(screen.getByText(/your data stays on your device/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /everything is stored privately on this device — no accounts, no servers, no tracking\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /load sample data/i })).toBeInTheDocument();
    expect(
      screen.queryByText(/local-only storage\. no servers, no tracking\./i),
    ).not.toBeInTheDocument();
  });

  it("shows data management and sync status", () => {
    renderWithProviders(<DashboardClient />);

    expect(screen.getByText(/data management/i)).toBeInTheDocument();
    expect(screen.getByText(/saved to browser/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download backup \(json\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear all data/i })).toBeInTheDocument();
  });

  it("renders the summary cards with net income and next maturity details", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T12:00:00Z"));
    localStorage.setItem("yieldflow-deposits", JSON.stringify(demoDeposits));
    renderWithProviders(<DashboardClient />);

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(value);

    const activeDeposits = demoDeposits.filter((deposit) => deposit.status !== "settled");
    const totalPrincipal = activeDeposits.reduce(
      (sum, deposit) => sum + deposit.principal,
      0,
    );

    const bankMap = new Map(demoBanks.map((bank) => [bank.id, bank]));
    const allSummaries = demoDeposits.map((deposit) =>
      buildDepositSummary(deposit, bankMap.get(deposit.bankId)!),
    );
    const activeSummaries = activeDeposits
      .map((deposit) => buildDepositSummary(deposit, bankMap.get(deposit.bankId)!))
      .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate));

    const currentMonthKey = monthKey(new Date());
    const currentMonthLabel = formatMonthLabel(new Date());
    let pendingIncome = 0;
    let settledIncome = 0;
    for (const summary of allSummaries) {
      if (monthKey(new Date(summary.maturityDate)) !== currentMonthKey) continue;
      if (summary.deposit.status === "settled") {
        settledIncome += summary.netInterest;
      } else if (summary.deposit.status === "matured") {
        pendingIncome += summary.netInterest;
      }
    }

    const nextMaturity = activeSummaries.find((summary) => !summary.deposit.isOpenEnded);

    expect(screen.getByText(/total principal/i)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(totalPrincipal))).toBeInTheDocument();
    expect(screen.getByText(/excludes settled investments/i)).toBeInTheDocument();

    expect(screen.getByText(/income this month/i)).toBeInTheDocument();
    expect(screen.getByText(`Net interest · ${currentMonthLabel}`)).toBeInTheDocument();
    expect(
      screen.getByText(formatCurrency(pendingIncome + settledIncome)),
    ).toBeInTheDocument();
    if (pendingIncome > 0) {
      expect(
        screen.getByText(`${formatCurrency(pendingIncome)} pending`),
      ).toBeInTheDocument();
    }
    if (settledIncome > 0) {
      expect(
        screen.getByText(`${formatCurrency(settledIncome)} settled`),
      ).toBeInTheDocument();
    }

    if (nextMaturity) {
      expect(
        screen.getAllByText(formatDate(new Date(nextMaturity.maturityDate))).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(`${nextMaturity.deposit.name} · ${nextMaturity.bank.name}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${formatCurrency(nextMaturity.netTotal)} net proceeds`),
      ).toBeInTheDocument();
    }
  });

  it("toggles the settled filter in the timeline view", async () => {
    localStorage.setItem("yieldflow-deposits", JSON.stringify(demoDeposits));
    renderWithProviders(<DashboardClient />);

    const activeDeposit = demoDeposits.find((deposit) => !/settled/i.test(deposit.name));
    const settledDeposit = demoDeposits.find((deposit) => /settled/i.test(deposit.name));
    expect(activeDeposit).toBeTruthy();
    expect(settledDeposit).toBeTruthy();

    await screen.findAllByRole("row");
    const table = screen.getByRole("table");
    expect(
      within(table).queryByText(toRegExp(settledDeposit!.name)),
    ).not.toBeInTheDocument();

    const toggle = await screen.findByLabelText(/show settled/i);
    fireEvent.click(toggle);

    const settledItems = await within(table).findAllByText(
      toRegExp(settledDeposit!.name),
    );
    expect(settledItems.length).toBeGreaterThan(0);

    const settledRow = settledItems.find((item) => item.closest("tr"));
    expect(settledRow?.closest("tr")?.className).toContain("opacity-50");

    const activeItem = screen.getAllByText(toRegExp(activeDeposit!.name))[0];
    const settledItem = settledItems[0];
    const position = activeItem.compareDocumentPosition(settledItem);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
