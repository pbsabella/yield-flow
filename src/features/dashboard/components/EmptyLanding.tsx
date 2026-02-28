import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyLandingProps {
  onAddData: () => void;
  onTryDemo: () => void;
  onImport: () => void;
}

export function EmptyLanding({ onAddData, onTryDemo, onImport }: EmptyLandingProps) {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-8 px-4 text-center">
      {/* Brand mark */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <LayoutDashboard className="size-7 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to YieldFlow
          </h1>
          <p className="mt-1 text-sm font-medium text-primary">beta</p>
        </div>
      </div>

      {/* Value prop */}
      <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
        Track your time deposits and savings in one place — maturity dates,
        net interest after tax, and your 12-month cash flow projection.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={onAddData}>
          Add my first investment
        </Button>
        <Button size="lg" variant="outline" onClick={onTryDemo}>
          Explore with demo data
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
  );
}
