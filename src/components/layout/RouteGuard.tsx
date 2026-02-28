"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = usePortfolioContext();
  const router = useRouter();

  useEffect(() => {
    if (status === "empty") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "booting" || status === "empty") {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
