import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PortfolioProvider } from "@/features/dashboard/context/PortfolioContext";
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

export const metadata: Metadata = {
  title: {
    default: "YieldFlow Lab",
    template: "%s | YieldFlow Lab",
  },
  description: "Precision yield ladder tracking and net-of-tax cash flow visualization.",
  // Blocks search engines from indexing the site
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yield-flow-lab.vercel.app/",
    siteName: "YieldFlow Lab",
    title: "YieldFlow Lab",
    description: "Visualize spendable reality with net-of-tax interest tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      </body>
    </html>
  );
}
