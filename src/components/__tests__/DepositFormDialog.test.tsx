import { screen } from "@testing-library/react";
import { AddInvestmentWizard } from "@/components/investment-wizard";
import type { Bank, TimeDeposit } from "@/lib/types";
import type { DepositFormState } from "@/components/dashboard/types";
import { renderWithProviders } from "@/components/__tests__/test-utils";

const banks: Bank[] = [
  { id: "maribank", name: "MariBank", taxRate: 0.2 },
  { id: "union", name: "Union Digital", taxRate: 0.2 },
];

const deposits: TimeDeposit[] = [];

const baseForm: DepositFormState = {
  bankId: "maribank",
  bankName: "MariBank",
  productId: "",
  productType: "savings",
  name: "Test",
  principal: "100000",
  startDate: "2026-02-01",
  isOpenEnded: true,
  termMonths: "12",
  endDate: "",
  termInputMode: "months",
  payoutFrequency: "monthly",
  compounding: "daily",
  taxRate: "0.2",
  rate: "0.0325",
  dayCountConvention: 360,
  tieredEnabled: true,
  tiers: [
    { id: "tier-1", upTo: "1000000", rate: "0.0325" },
    { id: "tier-2", upTo: "", rate: "0.0375" },
  ],
};

describe("AddInvestmentWizard", () => {
  it("renders step 1 in add mode", async () => {
    renderWithProviders(
      <AddInvestmentWizard
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        banks={banks}
        deposits={deposits}
        isEditMode={false}
        onSubmit={() => {}}
        onCustomBankAdd={() => {}}
      />,
    );

    expect(screen.getByText(/step 1 - bank & product/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /bank/i })).toBeInTheDocument();
  });

  it("renders step 2 in edit mode", async () => {
    renderWithProviders(
      <AddInvestmentWizard
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        banks={banks}
        deposits={deposits}
        initialForm={baseForm}
        isEditMode
        onSubmit={() => {}}
        onCustomBankAdd={() => {}}
      />,
    );

    expect(screen.getByText(/step 2 - investment details/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /change/i }).length).toBeGreaterThan(0);
  });

  it("shows tier builder when tiered toggle is enabled", async () => {
    renderWithProviders(
      <AddInvestmentWizard
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        banks={banks}
        deposits={deposits}
        initialForm={baseForm}
        isEditMode
        onSubmit={() => {}}
        onCustomBankAdd={() => {}}
      />,
    );

    expect(screen.getByText(/tier builder/i)).toBeInTheDocument();
  });
});
