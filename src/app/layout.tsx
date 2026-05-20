import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PortfolioProvider } from "@/features/portfolio/context/PortfolioContext";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = "https://yield-flow-lab.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "YieldFlow Lab",
    template: "%s | YieldFlow Lab",
  },
  description: "Free fixed-income tracker for time deposits and bonds. See net-of-withholding-tax interest, maturity countdowns, and 12-month cash flow forecasts.",
  icons: {
    icon: '/icon.svg',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "YieldFlow Lab",
    title: "YieldFlow Lab",
    description: "Know exactly when your money comes back — track maturity dates and net-of-withholding-tax income from bank deposits.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "YieldFlow Lab Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YieldFlow Lab",
    description: "Free fixed-income tracker for time deposits and bonds. Net-of-withholding-tax interest, maturity countdowns, and 12-month cash flow forecasts.",
    images: ["/og-image.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "YieldFlow Lab",
      "url": baseUrl,
      "description": "Fixed-income yield ladder tracker with net-of-withholding-tax cash flow forecasting.",
    },
    {
      "@type": "SoftwareApplication",
      "name": "YieldFlow Lab",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "offers": { "@type": "Offer", "price": "0" },
      "description": "Track maturity dates, visualize month-by-month net interest income, and forecast 12-month cash flow from bank time deposits and fixed-income instruments.",
      "featureList": [
        "Yield ladder with maturity countdown",
        "Net-of-withholding-tax interest calculation",
        "12-month cash flow projection chart",
        "Bank exposure concentration view",
        "Demo mode with sample portfolio",
      ],
      "screenshot": `${baseUrl}/og-image.png`,
      "url": baseUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <PortfolioProvider>
              <AppShell>
                {children}
              </AppShell>
            </PortfolioProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
