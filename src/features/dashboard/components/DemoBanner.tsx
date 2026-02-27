import { FlaskConical } from "lucide-react";

interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center text-center gap-2 border-b border-banner-border bg-banner-bg px-4 py-2 text-xs text-banner-fg">
      <div className="flex flex-wrap items-center justify-center text-center gap-2">
        <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Demo mode</span>
          {" · "}
          You&apos;re exploring sample data. Nothing is saved.
        </span>
      </div>
      <button
        onClick={onExit}
        aria-label="Exit demo mode"
        className="flex items-center gap-1 text-banner-fg transition-colors hover:text-banner-fg underline"
      >
        Exit Demo
      </button>
    </div>
  );
}
