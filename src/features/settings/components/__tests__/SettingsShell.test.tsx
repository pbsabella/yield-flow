import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsShell } from "../SettingsShell";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import type { TimeDeposit } from "@/types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEPOSITS_KEY = "yf:deposits";

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

function seedStorage(deposits: TimeDeposit[] = [deposit]) {
  localStorage.setItem(DEPOSITS_KEY, JSON.stringify(deposits));
}

function renderShell() {
  return render(
    <PortfolioProvider>
      <SettingsShell />
    </PortfolioProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ─── Export ───────────────────────────────────────────────────────────────────

describe("SettingsShell — export", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "Backup exported" toast on successful export', async () => {
    seedStorage();
    const { toast } = await import("sonner");
    renderShell();

    const exportBtn = await screen.findByRole("button", { name: /export json/i });
    fireEvent.click(exportBtn);

    expect(toast.success).toHaveBeenCalledWith("Backup exported");
  });

  it('shows "Export failed" toast when export throws', async () => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new Error("mock error");
    });
    seedStorage();
    const { toast } = await import("sonner");
    renderShell();

    const exportBtn = await screen.findByRole("button", { name: /export json/i });
    fireEvent.click(exportBtn);

    expect(toast.error).toHaveBeenCalledWith("Export failed — please try again");
  });
});

// ─── Import ───────────────────────────────────────────────────────────────────

describe("SettingsShell — import", () => {
  it("shows count toast after confirming import", async () => {
    seedStorage();
    const { toast } = await import("sonner");
    renderShell();

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      deposits: [deposit, { ...deposit, id: "dep-2" }],
    };
    const file = new File([JSON.stringify(backup)], "backup.json", {
      type: "application/json",
    });

    // Trigger file selection via the hidden input
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for preview dialog and click Replace
    const replaceBtn = await screen.findByRole("button", { name: /replace/i });
    fireEvent.click(replaceBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("2 investments imported");
    });
  });

  it("uses singular form for a single import", async () => {
    seedStorage();
    const { toast } = await import("sonner");
    renderShell();

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      deposits: [deposit],
    };
    const file = new File([JSON.stringify(backup)], "backup.json", {
      type: "application/json",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const replaceBtn = await screen.findByRole("button", { name: /replace/i });
    fireEvent.click(replaceBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("1 investment imported");
    });
  });
});
