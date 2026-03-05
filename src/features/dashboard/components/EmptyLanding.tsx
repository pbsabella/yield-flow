import { CalendarClock, TrendingUp, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingAnimation } from "./LandingAnimation";

interface EmptyLandingProps {
  onAddData: () => void;
  onTryDemo: () => void;
  onImport: () => void;
}

export function EmptyLanding({ onAddData, onTryDemo, onImport }: EmptyLandingProps) {
  return (
    <div className="grid min-h-[85dvh] items-center gap-10 px-6 py-10 md:grid-cols-2 md:gap-12 md:px-16">
      {/* ── Hero copy ── */}
      <div className="flex flex-col gap-6">
        {/* Eyebrow */}
        <Badge variant="primary">Fixed-income tracker</Badge>

        {/* Headline */}
        <h1 className="text-3xl font-semibold tracking-tight leading-tight md:text-4xl">
          Know exactly when<br />your money comes back
        </h1>

        {/* Feature bullets */}
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm text-muted-foreground leading-snug">
              Maturity countdown across every deposit
            </span>
          </li>
          <li className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm text-muted-foreground leading-snug">
              Net interest after tax — not misleading gross figures
            </span>
          </li>
          <li className="flex items-start gap-3">
            <BarChart2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm text-muted-foreground leading-snug">
              12-month cash flow forecast across your full portfolio
            </span>
          </li>
        </ul>

        {/* CTAs — demo first, reduces friction */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={onTryDemo}>
            Explore with demo data
          </Button>
          <Button size="lg" variant="outline" onClick={onAddData}>
            Add my first investment
          </Button>
        </div>

        {/* Privacy note */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Your data is stored locally and never leaves this device.</p>
          <p>
            Switching devices?{" "}
            <button
              onClick={onImport}
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Import a backup
            </button>
          </p>
        </div>
      </div>

      {/* ── Animation preview ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Browser chrome dots */}
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-destructive/60" aria-hidden="true" />
          <span className="size-2.5 rounded-full border border-status-warning-border bg-status-warning-bg" aria-hidden="true" />
          <span className="size-2.5 rounded-full border border-status-success-border bg-status-success-bg" aria-hidden="true" />
        </div>

        {/* Live 3-act animation */}
        <LandingAnimation />
      </div>
    </div>
  );
}
