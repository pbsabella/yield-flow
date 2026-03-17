import type { Metadata } from "next";
import { InvestmentsShell } from "@/features/investments/components/InvestmentsShell";

export const metadata: Metadata = {
  title: "Investments",
  description: "Track and manage your investment portfolio with a yield ladder view.",
  alternates: {
    canonical: '/investments',
  },
};

export default function InvestmentsPage() {
  return <InvestmentsShell />;
}
