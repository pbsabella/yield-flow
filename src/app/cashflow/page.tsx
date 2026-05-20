import type { Metadata } from "next";
import { CashFlowShell } from "@/features/cashflow/components/CashFlowShell";

export const metadata: Metadata = {
  title: "Cash Flow Projection",
  description: "Month-by-month cash flow forecast from your time deposits and bonds, net of withholding tax.",
  alternates: {
    canonical: '/cashflow',
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://yield-flow-lab.vercel.app" },
    { "@type": "ListItem", "position": 2, "name": "Cash Flow", "item": "https://yield-flow-lab.vercel.app/cashflow" },
  ],
};

export default function CashFlowPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CashFlowShell />
    </>
  );
}
