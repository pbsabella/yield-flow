import dynamic from "next/dynamic";

const ThemeToggle = dynamic(() => import("@/components/theme/ThemeToggle"), {
  ssr: false,
});

export default function Header() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="order-1 shrink-0 self-start md:order-2 md:self-auto">
        <ThemeToggle />
      </div>
      <div className="order-2 space-y-2 md:order-1">
        <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
          Yield ladder intelligence
        </div>
        <h1 className="text-3xl font-semibold md:text-4xl">YieldFlow</h1>
        <p className="text-secondary max-w-xl text-sm md:text-base">
          Track your fixed-income investments, visualize maturity timing, and see your
          passive income clearly.
        </p>
      </div>
    </div>
  );
}
