import { FlaskConical } from "lucide-react";

interface DemoBannerProps {
  onExit: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div className="text-center gap-2 border-b border-banner-border bg-banner-bg px-4 py-2 text-xs text-banner-fg">
      <FlaskConical className="size-3.5 shrink-0 inline-block mr-1 align-text-bottom" aria-hidden="true" />
      <span>
        <span className="font-semibold">Demo mode</span>
        {" · "}
        You&apos;re exploring sample data. Nothing is saved.
      </span>
      <button
        onClick={onExit}
        aria-label="Exit demo mode"
        className="inline-block ml-2 text-banner-fg transition-colors hover:text-banner-fg underline"
      >
        Exit Demo
      </button>
    </div>
  );
}
