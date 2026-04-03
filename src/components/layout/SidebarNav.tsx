"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutList, Settings, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "Investments", icon: LayoutList },
  { href: "/cashflow", label: "Cash Flow", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavItem({
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-accent-fg"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {badge}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { portfolio, hasSidebar } = usePortfolioContext();

  const maturedCount = hasSidebar
    ? portfolio.summaries.filter((s) => s.effectiveStatus === "matured").length
    : 0;

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="text-accent-fg font-semibold tracking-tight">YieldFlow</span>
        <Badge className="ml-2" variant="secondary">
          beta
        </Badge>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
            badge={
              href === "/investments" && maturedCount > 0 ? (
                <Badge variant="default" size="sm" className="min-w-4 tabular-nums">
                  {maturedCount}
                </Badge>
              ) : undefined
            }
          />
        ))}
      </nav>
    </div>
  );
}
