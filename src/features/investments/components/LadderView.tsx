"use client";

import { useMemo, useEffect, useRef } from "react";
import { CircleArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import {
  parseLocalDate,
  differenceInCalendarDays,
  addTermMonths,
  formatDate,
} from "@/lib/domain/date";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  summaries: EnrichedSummary[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "Jan 15" — short date for the desktop label column */
function shortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Desktop Gantt bar — full bar colored by status */
function barClasses(s: EnrichedSummary): string {
  const rounded = s.deposit.isOpenEnded ? "rounded-l-bar rounded-r-none" : "rounded-bar";
  if (s.effectiveStatus === "settled") return cn(rounded, "bg-progress-success-fill");
  if (s.effectiveStatus === "matured") return cn(rounded, "bg-progress-warning-fill");
  if (s.deposit.isOpenEnded) return cn(rounded, "bg-primary/40");
  return cn(rounded, "bg-primary");
}

/** Mobile bar — elapsed segment (left of today) */
function mobileElapsedClass(s: EnrichedSummary): string {
  if (s.effectiveStatus === "settled") return "bg-progress-success-fill";
  if (s.effectiveStatus === "matured") return "bg-progress-warning-fill";
  if (s.deposit.isOpenEnded) return "bg-primary/50";
  return "bg-primary";
}

/** Mobile bar — remaining segment (right of today) */
function mobileRemainingClass(s: EnrichedSummary): string {
  if (s.effectiveStatus === "settled" || s.effectiveStatus === "matured") return "";
  if (s.deposit.isOpenEnded) return "bg-primary/20";
  return "bg-primary/25";
}

// ─── Shared range calculation ─────────────────────────────────────────────────

// today is created inside the memo (same pattern as usePortfolioData) so it's
// always fresh on re-run without needing a separate stable reference as a dep.
function useRange(summaries: EnrichedSummary[]) {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (summaries.length === 0) {
      return {
        rangeStart: today,
        totalDays: 1,
        monthTicks: [] as Date[],
        todayPct: 50,
        today,
        parsedDates: new Map<string, { startDate: Date; endDate: Date }>(),
      };
    }

    // Parse once and store by deposit ID so render loops can reuse without re-parsing.
    const parsedDates = new Map<string, { startDate: Date; endDate: Date }>();
    const starts: Date[] = [];
    const ends: Date[] = [];
    for (const s of summaries) {
      const startDate = parseLocalDate(s.deposit.startDate);
      const endDate = s.maturityDate ? parseLocalDate(s.maturityDate) : addTermMonths(today, 1);
      parsedDates.set(s.deposit.id, { startDate, endDate });
      starts.push(startDate);
      ends.push(endDate);
    }

    // Snap to the 1st of the month so the first month tick always lands at 0%,
    // avoiding clamping distortion that crowds the first two labels.
    const earliestStart = starts.reduce((a, b) => (a < b ? a : b));
    const rangeStart = new Date(earliestStart.getFullYear(), earliestStart.getMonth(), 1);
    const maxEnd = ends.reduce((a, b) => (a > b ? a : b));
    // 1-month buffer after the latest end so the last bar isn't flush to the edge
    const rangeEnd = addTermMonths(maxEnd, 1);
    const totalDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart));

    // First day of each month in [rangeStart, rangeEnd]
    const monthTicks: Date[] = [];
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (cursor <= rangeEnd) {
      monthTicks.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const todayPct = Math.max(
      0,
      Math.min(100, (differenceInCalendarDays(today, rangeStart) / totalDays) * 100),
    );

    return { rangeStart, totalDays, monthTicks, todayPct, today, parsedDates };
  }, [summaries]);
}

// ─── Desktop: Gantt layout ────────────────────────────────────────────────────

function DesktopLadder({
  summaries,
  fmtCurrency,
}: Props & { fmtCurrency: (n: number) => string }) {
  const sorted = useMemo(
    () => [...summaries].sort((a, b) => a.deposit.startDate.localeCompare(b.deposit.startDate)),
    [summaries],
  );

  const { rangeStart, totalDays, monthTicks, todayPct, parsedDates } = useRange(sorted);

  function toPercent(date: Date): number {
    return Math.max(
      0,
      Math.min(100, (differenceInCalendarDays(date, rangeStart) / totalDays) * 100),
    );
  }

  const todayVisible = todayPct > 0 && todayPct < 100;

  // Scroll the timeline so today is centered on mount.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || todayPct <= 0 || todayPct >= 100) return;
    const targetLeft = (todayPct / 100) * el.scrollWidth - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, targetLeft);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const MIN_MONTH_WIDTH = 48;
  // Filter out ticks that would render too close to the previous visible label.
  // 44px ≈ max width of "MMM 'YY" at text-[10px] with a small gap.
  const LABEL_MIN_GAP_PX = 44;
  const minContainerWidth = monthTicks.length * MIN_MONTH_WIDTH;
  const shownTicks = monthTicks.reduce<Date[]>((acc, tick) => {
    if (acc.length === 0) return [tick];
    const distPx =
      ((toPercent(tick) - toPercent(acc[acc.length - 1])) / 100) * minContainerWidth;
    return distPx >= LABEL_MIN_GAP_PX ? [...acc, tick] : acc;
  }, []);

  return (
    <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
      <div
        role="region"
        aria-label="Investment ladder timeline"
        className="flex select-none"
      >
        {/* Label column */}
        <div className="w-48 shrink-0 flex flex-col border-r border-border/50" aria-hidden="true">
          {/* Spacer aligns with the month axis row */}
          <div className="h-10" />
          {sorted.map((s) => {
            const dateRange = s.maturityDate
              ? `${shortDate(s.deposit.startDate)} – ${shortDate(s.maturityDate)}`
              : `${shortDate(s.deposit.startDate)} · Open`;
            return (
              <div
                key={s.deposit.id}
                className="h-16 flex flex-col justify-center px-card-x border-b border-border/50 last:border-0"
              >
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {s.bank.name} · {dateRange}
                </p>
                <p className="text-sm font-semibold truncate leading-snug">
                  {s.deposit.name || "—"}
                </p>
                <p className="text-[11px] text-muted-foreground tabular-nums leading-tight">
                  {fmtCurrency(s.deposit.principal)} · <span className="text-accent-fg">+{fmtCurrency(s.netInterest)} net</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Timeline area — outer scrolls, inner enforces minimum month width */}
        {/* tabIndex="0" makes the scrollable region keyboard-focusable (WCAG 2.1.1) */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto min-w-0" tabIndex={0}>
          <div
            className="relative"
            style={{ minWidth: monthTicks.length * MIN_MONTH_WIDTH }}
          >
            {/* Month axis */}
            <div className="h-10 relative border-b border-border/50">
              {shownTicks.map((tick, i) => {
                const isFirst = i === 0;
                const isLast = i === shownTicks.length - 1;
                const showYear = isFirst || tick.getMonth() === 0;
                const label =
                  tick.toLocaleDateString("en-US", { month: "short" }) +
                  (showYear ? ` '${String(tick.getFullYear()).slice(2)}` : "");
                const alignClass = isFirst
                  ? "translate-x-0"
                  : isLast
                    ? "-translate-x-full"
                    : "-translate-x-1/2";
                return (
                  <span
                    key={tick.getTime()}
                    style={{ left: `${toPercent(tick)}%` }}
                    className={cn("absolute bottom-2 text-[10px] text-muted-foreground", alignClass)}
                  >
                    {label}
                  </span>
                );
              })}
              {todayVisible && (
                <span
                  style={{ left: `${todayPct}%` }}
                  className="absolute bottom-2 text-[10px] font-semibold text-accent-fg -translate-x-1/2 z-20 bg-card px-0.5"
                >
                  Today
                </span>
              )}
            </div>

            {/* Today line — spans all rows */}
            {todayVisible && (
              <div
                aria-hidden="true"
                style={{ left: `${todayPct}%` }}
                className="absolute top-10 bottom-0 w-px bg-primary/30 z-10 pointer-events-none"
              />
            )}

            {/* Investment rows — screen readers get data from the label column */}
            {sorted.map((s) => {
              // Reuse dates already parsed by useRange — no redundant parseLocalDate calls.
              const { startDate, endDate } = parsedDates.get(s.deposit.id)!;
              const leftPct = toPercent(startDate);
              const widthPct = Math.max(
                0.5,
                (differenceInCalendarDays(endDate, startDate) / totalDays) * 100,
              );

              return (
                <div
                  key={s.deposit.id}
                  className="relative h-16 border-b border-border/50 last:border-0"
                  aria-hidden="true"
                >
                  <div
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={cn("absolute top-4 h-8 overflow-hidden", barClasses(s))}
                  >
                    {s.effectiveStatus === "settled" && widthPct > 2 && (
                      <CircleCheck size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                    )}
                    {s.effectiveStatus === "matured" && widthPct > 2 && (
                      <TriangleAlert size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                    )}
                    {!s.maturityDate && widthPct > 2 && (
                      <CircleArrowRight size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground pointer-events-none" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: mini-bar cards ───────────────────────────────────────────────────

function MobileCard({
  summary: s,
  fmtCurrency,
  today,
}: {
  summary: EnrichedSummary;
  fmtCurrency: (n: number) => string;
  today: Date;
}) {

  const startDate = parseLocalDate(s.deposit.startDate);
  const endDate = s.maturityDate ? parseLocalDate(s.maturityDate) : addTermMonths(today, 1);
  const spanDays = Math.max(1, differenceInCalendarDays(endDate, startDate));
  const todayMarkerPct = Math.max(
    0,
    Math.min(100, (differenceInCalendarDays(today, startDate) / spanDays) * 100),
  );
  // const todayInRange = todayMarkerPct > 0 && todayMarkerPct < 100;

  return (
    <li className="rounded-lg border border-border bg-card p-4 space-y-stack-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-stack-xs">
        <p className="text-xs text-muted-foreground font-medium truncate">{s.bank.name}</p>
        <StatusBadge status={s.effectiveStatus} />
      </div>

      {/* Deposit name */}
      <p className="text-sm font-semibold leading-snug">{s.deposit.name || "—"}</p>

      {/* Mini bar — two-segment: elapsed (solid) | remaining (faded) */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5 tabular-nums">
          <span>{formatDate(startDate)}</span>
          <span>{s.maturityDate ? formatDate(endDate) : "Open-ended"}</span>
        </div>
        {/* Bar track */}
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          {/* Elapsed portion — from start up to today */}
          <div
            style={{ width: `${todayMarkerPct}%` }}
            className={cn("absolute left-0 top-0 bottom-0", mobileElapsedClass(s))}
          />
          {/* Remaining portion — from today to maturity */}
          <div
            style={{ left: `${todayMarkerPct}%` }}
            className={cn("absolute top-0 bottom-0 right-0", mobileRemainingClass(s))}
          />
        </div>
        {/* "Today" label below the divider — only when today falls within the term */}
        {/* {todayInRange && (
          <div aria-hidden="true" className="relative h-4">
            <span
              style={{ left: `${todayMarkerPct}%` }}
              className="absolute top-0.5 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
            >
              Today
            </span>
          </div>
        )} */}
      </div>

      {/* Principal + net */}
      <p className="text-xs text-muted-foreground tabular-nums">
        {fmtCurrency(s.deposit.principal)} principal{" "}
        <span className="text-accent-fg">+{fmtCurrency(s.netInterest)} net</span>
      </p>
    </li>
  );
}

function MobileLadder({
  summaries,
  fmtCurrency,
}: Props & { fmtCurrency: (n: number) => string }) {
  const sorted = useMemo(
    () => [...summaries].sort((a, b) => a.deposit.startDate.localeCompare(b.deposit.startDate)),
    [summaries],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <ul
      role="list"
      aria-label="Investment ladder"
      className="md:hidden space-y-stack-sm"
    >
      {sorted.map((s) => (
        <MobileCard key={s.deposit.id} summary={s} fmtCurrency={fmtCurrency} today={today} />
      ))}
    </ul>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LadderView({ summaries }: Props) {
  const { fmtCurrency } = useFormatterContext();

  return (
    <>
      <DesktopLadder summaries={summaries} fmtCurrency={fmtCurrency} />
      <MobileLadder summaries={summaries} fmtCurrency={fmtCurrency} />
    </>
  );
}
