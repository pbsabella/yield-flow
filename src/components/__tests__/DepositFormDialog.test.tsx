import { screen } from "@testing-library/react";
import DepositFormDialog from "@/components/dashboard/DepositFormDialog";
import type { Bank } from "@/lib/types";
import type { DepositFormErrors, DepositFormState } from "@/components/dashboard/types";
import { renderWithProviders } from "@/components/__tests__/test-utils";

const banks: Bank[] = [
  { id: "mari", name: "MariBank", taxRate: 0.2 },
  { id: "union", name: "Union Digital", taxRate: 0.2 },
];

const baseForm: DepositFormState = {
  bankId: "mari",
  bankName: "MariBank",
  name: "",
  principal: "",
  startDate: "",
  termMonths: "1",
  tenurePreset: "30d",
  termType: "fixed",
  payoutFrequency: "monthly",
  interestMode: "simple",
  interestTreatment: "reinvest",
  compounding: "daily",
  taxRate: "0.2",
  tier1Cap: "1000000",
  tier1Rate: "0.0325",
  tier2Rate: "0.0375",
  flatRate: "0.0325",
};

describe("DepositFormDialog", () => {
  it("renders required fields and disables save when empty", async () => {
    renderWithProviders(
      <DepositFormDialog
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        title="Add an investment"
        banks={banks}
        form={baseForm}
        errors={{}}
        onValidate={() => {}}
        onSubmit={() => {}}
        onReset={() => {}}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /add an investment/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/bank/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/principal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();

    const save = screen.getByRole("button", { name: /save/i });
    expect(save).toBeDisabled();
  });

  it("shows tiered fields when tiered mode selected", async () => {
    const form: DepositFormState = { ...baseForm, name: "Test", interestMode: "tiered" };

    renderWithProviders(
      <DepositFormDialog
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        title="Add an investment"
        banks={banks}
        form={form}
        errors={{} as DepositFormErrors}
        onValidate={() => {}}
        onSubmit={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByLabelText(/base rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/threshold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/secondary rate/i)).toBeInTheDocument();
  });

  it("shows custom tenure input when custom selected", async () => {
    const form: DepositFormState = { ...baseForm, name: "Test", tenurePreset: "custom" };

    renderWithProviders(
      <DepositFormDialog
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Open</button>}
        title="Add an investment"
        banks={banks}
        form={form}
        errors={{}}
        onValidate={() => {}}
        onSubmit={() => {}}
        onReset={() => {}}
      />,
    );

    expect(screen.getByLabelText(/custom tenure/i)).toBeInTheDocument();
  });
});
