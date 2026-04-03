"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutList, Plus, Settings, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";

const LEFT_TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "Investments", icon: LayoutList },
] as const;

const RIGHT_TABS = [
  { href: "/cashflow", label: "Cash Flow", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavTab({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
        active
          ? "text-sidebar-primary"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon className={cn("size-5", active && "text-sidebar-primary")} aria-hidden="true" />
        {badge}
      </span>
      {label}
    </Link>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  const { openWizard, hasSidebar, portfolio } = usePortfolioContext();

  const maturedCount = portfolio.summaries.filter((s) => s.effectiveStatus === "matured").length;

  if (!hasSidebar) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-sidebar-border bg-sidebar md:hidden"
      aria-label="Bottom navigation"
    >
      {/* Left tabs */}
      {LEFT_TABS.map(({ href, label, icon }) => (
        <NavTab
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={pathname === href}
          badge={
            href === "/investments" && maturedCount > 0 ? (
              <Badge
                variant="default"
                size="xs"
                className="absolute -top-1 -right-2.5 min-w-3.5 tabular-nums"
              >
                {maturedCount}
              </Badge>
            ) : undefined
          }
        />
      ))}

      {/* Center Add button */}
      <div className="flex flex-1 items-center justify-center">
        <button
          onClick={() => openWizard()}
          aria-label="Add investment"
          className="flex size-12 -translate-y-1 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Right tabs */}
      {RIGHT_TABS.map(({ href, label, icon }) => (
        <NavTab key={href} href={href} label={label} icon={icon} active={pathname === href} />
      ))}
    </nav>
  );
}
