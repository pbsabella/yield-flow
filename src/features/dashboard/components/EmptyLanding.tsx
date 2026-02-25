import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyLandingProps {
  onAddData: () => void;
  onTryDemo: () => void;
}

export function EmptyLanding({ onAddData, onTryDemo }: EmptyLandingProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <TrendingUp className="size-12 text-muted-foreground/30" aria-hidden="true" />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Track your yield ladder</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          See all your time deposits in one place — maturity dates, net interest after tax, and monthly cash flow.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onAddData}>Add my first investment</Button>
        <Button variant="outline" onClick={onTryDemo}>
          Explore with demo data
        </Button>
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">
        Your data is stored locally in this browser and never sent to a server.{" "}
        <span className="text-muted-foreground">Not recommended on shared computers.</span>
      </p>

      <p className="text-xs text-muted-foreground">
        Switching devices?{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Import a backup
        </Link>
      </p>
    </div>
  );
}
