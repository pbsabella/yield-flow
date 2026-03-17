import type { Metadata } from "next";
import { CashFlowShell } from "@/features/cashflow/components/CashFlowShell";

export const metadata: Metadata = {
  title: "Cash Flow Projection",
  description: "Visualize your net-of-tax cash flow projections with precision and clarity.",
  alternates: {
    canonical: '/cashflow',
  },
};

export default function CashFlowPage() {
  return <CashFlowShell />;
}
