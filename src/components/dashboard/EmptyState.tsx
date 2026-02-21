import { Database } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  onSeed: () => void;
  ctaLabel: string;
};

export default function EmptyState({ onSeed, ctaLabel }: Props) {
  return (
    <div className="border-subtle bg-surface-soft mt-6 flex flex-col items-start gap-4 rounded-2xl border border-dashed p-6 transition-colors duration-200 ease-out">
      <div>
        <p className="text-sm font-semibold">No investments yet</p>
        <p className="text-muted text-sm">
          Load sample data to explore YieldFlow instantly.
        </p>
      </div>
      <Button size="sm" onClick={onSeed}>
        <Database className="h-4 w-4" />
        {ctaLabel}
      </Button>
    </div>
  );
}
