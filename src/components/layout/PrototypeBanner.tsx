export function PrototypeBanner() {
  return (
    <div className="text-center border-b border-banner-border bg-banner-bg px-4 py-2 text-xs text-banner-fg">
      <span className="font-semibold">Beta Release</span>
      <span className="text-banner-fg">{" · "}</span>
      <span>YieldFlow is under active development. Features and logic may evolve frequently.</span>
    </div>
  );
}
