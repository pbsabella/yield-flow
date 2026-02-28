import type { Metadata } from "next";
import { CashFlowShell } from "@/features/cashflow/components/CashFlowShell";

export const metadata: Metadata = {
  title: "Cash Flow",
};

export default function CashFlowPage() {
  return <CashFlowShell />;
}
