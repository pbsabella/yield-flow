import { FlaskConical, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="border-y border-primary/30 bg-primary/10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 flex h-full items-center justify-between">
        <Alert className="rounded-none border-0 bg-transparent py-2 px-0 items-baseline">
          <FlaskConical className="size-4" aria-hidden="true" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              <span className="font-semibold">Demo mode:</span> You&apos;re exploring sample data.
              Nothing is saved, even if you add, edit, or delete.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="shrink-0 gap-1.5 text-xs"
            >
              <X className="size-3" aria-hidden="true" />
              Exit demo
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
