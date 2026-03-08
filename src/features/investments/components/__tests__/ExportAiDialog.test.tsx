import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportAiDialog } from "../ExportAiDialog";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  summaries: [],
  monthlyAllowance: [],
  preferences: { currency: "PHP", bankInsuranceLimit: undefined },
};

function renderDialog(props = defaultProps) {
  return render(
    <PortfolioProvider>
      <ExportAiDialog {...props} />
    </PortfolioProvider>,
  );
}

describe("ExportAiDialog — Download .md", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows success toast on successful download", async () => {
    const { toast } = await import("sonner");
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    expect(toast.success).toHaveBeenCalledWith("File downloaded");
  });

  it("shows error toast when download throws", async () => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new Error("mock error");
    });
    const { toast } = await import("sonner");
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /download/i }));

    expect(toast.error).toHaveBeenCalledWith(
      "Download failed — try copying instead",
    );
  });
});
