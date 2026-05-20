import type { Metadata } from "next";
import { InvestmentsShell } from "@/features/investments/components/InvestmentsShell";

export const metadata: Metadata = {
  title: "Investments",
  description: "Yield ladder view of your fixed-income portfolio — maturities, rates, and net interest at a glance.",
  alternates: {
    canonical: '/investments',
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://yield-flow-lab.vercel.app" },
    { "@type": "ListItem", "position": 2, "name": "Investments", "item": "https://yield-flow-lab.vercel.app/investments" },
  ],
};

export default function InvestmentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <InvestmentsShell />
    </>
  );
}
