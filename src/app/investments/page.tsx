import type { Metadata } from "next";
import { InvestmentsShell } from "@/features/investments/components/InvestmentsShell";

export const metadata: Metadata = {
  title: "Investments",
};

export default function InvestmentsPage() {
  return <InvestmentsShell />;
}
