"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, Info, TrendingUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { usePortfolioContext } from "@/features/dashboard/context/PortfolioContext";
import { monthKey } from "@/lib/domain/date";
import { cn } from "@/lib/utils";
import type { MonthlyAllowance } from "@/types";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from "@/features/dashboard/components/EmptyState";

// ─── Constants ────────────────────────────────────────────────────────────────

type Window = "3" | "6" | "12" | "all";

const MONTH_WIDTH = 48;
const SVG_HEIGHT = 180;
const PAD_TOP = 28;
const PAD_BOTTOM = 24;
const PAD_X = 20;

// ─── Area chart helpers ────────────────────────────────────────────────────────

function smoothCurve(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpX = (curr.x + next.x) / 2;
    d += ` C ${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`;
  }
  return d;
}

// ─── Area chart ───────────────────────────────────────────────────────────────

function AreaChart({
  months,
  currentMonthKey,
  currentMonthFull,
  fmtCurrency,
}: {
  months: MonthlyAllowance[];
  currentMonthKey: string;
  currentMonthFull: MonthlyAllowance | null;
  fmtCurrency: (value: number) => string;
}) {
  const effectiveNet = (m: MonthlyAllowance) =>
    m.monthKey === currentMonthKey && currentMonthFull != null
      ? currentMonthFull.net
      : m.net;

  const maxNet = Math.max(...months.map(effectiveNet), 1);
  const plotHeight = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const svgWidth = months.length * MONTH_WIDTH + PAD_X * 2;
  const baselineY = PAD_TOP + plotHeight;

  const pts = months.map((m, i) => ({
    x: PAD_X + MONTH_WIDTH * i + MONTH_WIDTH / 2,
    y: PAD_TOP + plotHeight * (1 - effectiveNet(m) / maxNet),
    net: effectiveNet(m),
    isCurrent: m.monthKey === currentMonthKey,
    label: format(parseISO(m.monthKey + "-01"), "MMM"),
    monthKey: m.monthKey,
  }));

  const linePath = smoothCurve(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${baselineY} L ${pts[0].x},${baselineY} Z`;

  const maxIdx = pts.reduce((best, pt, i) => (pt.net > pts[best].net ? i : best), 0);

  return (
    <div
      className="overflow-x-auto rounded-lg"
      role="region"
      aria-label="Interest projection trend chart"
      tabIndex={0}
    >
      <svg
        width={svgWidth}
        height={SVG_HEIGHT}
        className="text-primary"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Filled area */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Stroke line */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current month dot */}
        {pts.map((pt) =>
          pt.isCurrent ? (
            <circle
              key={pt.monthKey}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            />
          ) : null,
        )}

        {/* Peak value label */}
        <text
          x={pts[maxIdx].x}
          y={pts[maxIdx].y - 8}
          textAnchor="middle"
          fontSize="9"
          fontWeight="500"
          className="fill-foreground tabular-nums"
        >
          {fmtCurrency(pts[maxIdx].net)}
        </text>

        {/* X-axis labels */}
        {pts.map((pt) => (
          <text
            key={pt.monthKey}
            x={pt.x}
            y={SVG_HEIGHT - 6}
            textAnchor="middle"
            fontSize="9"
            fontWeight={pt.isCurrent ? "600" : "400"}
            className={pt.isCurrent ? "fill-foreground" : "fill-muted-foreground"}
          >
            {pt.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Window filter ────────────────────────────────────────────────────────────

function WindowFilter({
  value,
  onChange,
}: {
  value: Window;
  onChange: (v: Window) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="card"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as Window);
      }}
    >
      <ToggleGroupItem value="3">3M</ToggleGroupItem>
      <ToggleGroupItem value="6">6M</ToggleGroupItem>
      <ToggleGroupItem value="12">12M</ToggleGroupItem>
      <ToggleGroupItem value="all">All</ToggleGroupItem>
    </ToggleGroup>
  );
}

// ─── Monthly breakdown row ────────────────────────────────────────────────────

type AllowanceEntry = MonthlyAllowance["entries"][number];

function EntryGroup({
  label,
  entries,
  isCurrent,
  fmtCurrency,
}: {
  label: string;
  entries: AllowanceEntry[];
  isCurrent: boolean;
  fmtCurrency: (value: number) => string;
}) {
  if (entries.length === 0) return null;
  return (
    <div>
      <p className="text-[12px] uppercase text-muted-foreground my-1">
        {label}
      </p>
      {entries.map((entry) => {
        const isSettled = entry.status === "settled";
        return (
          <div key={entry.depositId} className="py-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span
                className={cn(
                  "flex items-center gap-1.5 min-w-0 flex-1",
                )}
              >
                <span className="font-semibold truncate">
                  {entry.name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  · {entry.bankName}
                </span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {isCurrent && entry.status === "matured" && (
                  <Badge variant="alert" className="text-xs h-4 font-normal">
                    Due now
                  </Badge>
                )}
                {isCurrent && isSettled && (
                  <Badge variant="success" className="text-xs h-4 font-normal">
                    Settled
                  </Badge>
                )}
                <span
                  className={cn("tabular-nums font-medium")}
                >
                  {fmtCurrency(entry.amountNet)}
                </span>
              </span>
            </div>
            {(entry.principalReturned ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                +{fmtCurrency(entry.principalReturned!)} principal
                returned
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthRow({
  month,
  isCurrent,
  currentMonthFull,
  fmtCurrency,
}: {
  month: MonthlyAllowance;
  isCurrent: boolean;
  currentMonthFull: MonthlyAllowance | null;
  fmtCurrency: (value: number) => string;
}) {
  const [open, setOpen] = useState(isCurrent);

  const displayEntries = isCurrent ? (currentMonthFull?.entries ?? month.entries) : month.entries;
  const displayNet = isCurrent ? (currentMonthFull?.net ?? month.net) : month.net;

  const maturityEntries = displayEntries.filter((e) => e.payoutFrequency === "maturity");
  const monthlyEntries = displayEntries.filter((e) => e.payoutFrequency === "monthly");

  return (
    <Card className="p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-0">
          <CollapsibleTrigger
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 gap-2 text-sm font-medium hover:bg-muted transition-colors",
              open && "bg-primary/5",
            )}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span>{month.label}</span>
              {isCurrent && (
                <Badge variant="info" className="font-normal">
                  Current month
                </Badge>
              )}
            </span>
            <span className="flex items-center gap-2 tabular-nums ml-auto">
              <span className={cn(isCurrent && "text-base font-semibold text-primary dark:text-primary-subtle")}>
                {fmtCurrency(displayNet)}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180",
                )}
              />
            </span>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="border-t py-2 pr-10 space-y-4">
            <EntryGroup
              label="At maturity payouts"
              entries={maturityEntries}
              isCurrent={isCurrent}
              fmtCurrency={fmtCurrency}
            />
            <EntryGroup
              label="Monthly payouts"
              entries={monthlyEntries}
              isCurrent={isCurrent}
              fmtCurrency={fmtCurrency}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CashFlowTabProps {
  monthlyAllowance: MonthlyAllowance[];
  currentMonthFull: MonthlyAllowance | null;
}

export function CashFlowTab({ monthlyAllowance, currentMonthFull }: CashFlowTabProps) {
  const { fmtCurrency } = usePortfolioContext();
  const [window, setWindow] = useState<Window>("12");
  const currentMonthKey = monthKey(new Date());
  const futureMonths = monthlyAllowance.filter(
    (m) => m.monthKey >= currentMonthKey,
  );
  const slicedMonths =
    window === "all" ? futureMonths : futureMonths.slice(0, Number(window));

  if (monthlyAllowance.length === 0 || futureMonths.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No upcoming cash flow"
        description="Add active deposits in the Investments tab to see your 12-month income projection."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex gap-1 items-center text-xs text-muted-foreground">
          <Info className="shrin-0" size="13" aria-hidden="true" />
          All amounts are net of withholding tax
        </p>
        <WindowFilter value={window} onChange={setWindow} />
      </div>
      <AreaChart months={slicedMonths} currentMonthKey={currentMonthKey} currentMonthFull={currentMonthFull} fmtCurrency={fmtCurrency} />
      <div className="space-y-3">
        {slicedMonths.map((month) => (
          <MonthRow
            key={month.monthKey}
            month={month}
            isCurrent={month.monthKey === currentMonthKey}
            currentMonthFull={currentMonthFull}
            fmtCurrency={fmtCurrency}
          />
        ))}
      </div>
    </div>
  );
}
