import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/components/__tests__/test-utils";
import MonthlyFlow from "@/components/dashboard/MonthlyFlow";
import type { MonthlyAllowance } from "@/lib/types";
import { formatMonthLabel, monthKey } from "@/lib/domain/date";
import { vi } from "vitest";

describe("MonthlyFlow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a 12-month window with empty month rows and net-only labels", () => {
    const current = new Date();
    const currentLabel = formatMonthLabel(current);
    const currentKey = monthKey(current);

    const items: MonthlyAllowance[] = [
      {
        monthKey: currentKey,
        label: currentLabel,
        net: 12000,
        entries: [
          {
            depositId: "td-1",
            name: "CIMB - 3M",
            bankName: "CIMB",
            payoutFrequency: "monthly",
            amountNet: 4000,
            status: "active",
          },
          {
            depositId: "td-2",
            name: "OwnBank - 90",
            bankName: "OwnBank",
            payoutFrequency: "maturity",
            amountNet: 8000,
            status: "matured",
          },
        ],
      },
      {
        monthKey: "2027-03",
        label: "Mar 2027",
        net: 5000,
        entries: [
          {
            depositId: "td-3",
            name: "Tonik - 12M",
            bankName: "Tonik",
            payoutFrequency: "maturity",
            amountNet: 5000,
          },
        ],
      },
    ];

    renderWithProviders(
      <MonthlyFlow
        items={items}
        currentMonthKey={currentKey}
        currentMonthPending={4000}
        currentMonthSettled={8000}
      />,
    );

    expect(screen.getByText(currentLabel)).toBeInTheDocument();
    expect(screen.getAllByText(/net income/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/gross/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/no payouts in/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/settled/i)).toBeInTheDocument();

    expect(screen.queryByText(/mar 2027/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show all/i }));
    expect(screen.getByText(/mar 2027/i)).toBeInTheDocument();
  });

  it("hides the settled pill when settled is zero", () => {
    const current = new Date();
    const currentLabel = formatMonthLabel(current);
    const currentKey = monthKey(current);

    const items: MonthlyAllowance[] = [
      {
        monthKey: currentKey,
        label: currentLabel,
        net: 4000,
        entries: [
          {
            depositId: "td-1",
            name: "CIMB - 3M",
            bankName: "CIMB",
            payoutFrequency: "monthly",
            amountNet: 4000,
            status: "active",
          },
        ],
      },
    ];

    renderWithProviders(
      <MonthlyFlow
        items={items}
        currentMonthKey={currentKey}
        currentMonthPending={4000}
        currentMonthSettled={0}
      />,
    );

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.queryByText(/settled/i)).not.toBeInTheDocument();
  });
});
