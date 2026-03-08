import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import DashboardShell from "../DashboardShell";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import type { TimeDeposit } from "@/types";
import { fireEvent } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const deposit: TimeDeposit = {
  id: "dep-1",
  bankId: "test-bank",
  name: "My Deposit",
  principal: 100_000,
  startDate: "2026-01-01",
  termMonths: 12,
  interestMode: "simple",
  interestTreatment: "payout",
  compounding: "daily",
  flatRate: 0.065,
  tiers: [],
  payoutFrequency: "maturity",
  dayCountConvention: 365,
  status: "active",
};

const validBackup = {
  version: 1,
  exportedAt: new Date().toISOString(),
  deposits: [deposit, { ...deposit, id: "dep-2" }],
};

function makeMockFileReader(result: string) {
  return class MockFileReader {
    onload: ((evt: { target: { result: string } }) => void) | null = null;
    readAsText() {
      this.onload?.({ target: { result } });
    }
  };
}

function renderShell() {
  return render(
    <PortfolioProvider>
      <DashboardShell />
    </PortfolioProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Import via EmptyLanding ──────────────────────────────────────────────────

describe("DashboardShell — import feedback", () => {
  it("shows count toast after a valid file import", async () => {
    const { toast } = await import("sonner");
    vi.stubGlobal("FileReader", makeMockFileReader(JSON.stringify(validBackup)));
    renderShell();

    const file = new File([JSON.stringify(validBackup)], "backup.json", {
      type: "application/json",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file], writable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("2 investments imported");
    });
  });

  it("shows error toast for an invalid backup file", async () => {
    const { toast } = await import("sonner");
    vi.stubGlobal("FileReader", makeMockFileReader("not valid json"));
    renderShell();

    const file = new File(["not valid json"], "bad.json", {
      type: "application/json",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file], writable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Import failed",
        expect.objectContaining({ description: expect.any(String) }),
      );
    });
  });
});
