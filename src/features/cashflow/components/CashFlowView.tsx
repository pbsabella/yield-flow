"use client";

import { memo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { Info, TrendingUp } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { useFormatterContext } from "@/features/portfolio/context/PortfolioContext";
import { monthKey } from "@/lib/domain/date";
import { cn } from "@/lib/utils";
import type { MonthlyAllowance } from "@/types";
import { EmptyState } from "@/features/dashboard/components/EmptyState";

// ─── Constants ────────────────────────────────────────────────────────────────

type Window = "3" | "6" | "12" | "all";

// ─── Area chart ───────────────────────────────────────────────────────────────

const AreaChart = memo(function AreaChart({
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

  const data = months.map((m) => ({
    monthKey: m.monthKey,
    net: effectiveNet(m),
    label: new Date(m.monthKey + "T00:00:00").toLocaleString("en", { month: "short" }),
    isCurrent: m.monthKey === currentMonthKey,
  }));

  const maxIdx = data.reduce((best, d, i) => (d.net > data[best].net ? i : best), 0);
  const peak = data[maxIdx];
  const current = data.find((d) => d.isCurrent);

  return (
    <div
      className="overflow-x-auto rounded-lg text-primary"
      role="region"
      aria-label="Interest projection trend chart"
      tabIndex={0}
    >
      <ResponsiveContainer width="100%" height={180}>
        <RechartsAreaChart data={data} margin={{ top: 28, right: 20, bottom: 32, left: 20 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="monthKey"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tick={(props: any) => {
              const { x, y, payload } = props;
              const d = data.find((d) => d.monthKey === payload.value);
              const idx = data.findIndex((d) => d.monthKey === payload.value);
              const currYear = (payload.value as string).slice(0, 4);
              const prevYear = idx > 0 ? data[idx - 1].monthKey.slice(0, 4) : null;
              const showYear = idx === 0 || currYear !== prevYear;
              return (
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={d?.isCurrent ? 600 : 400}
                  className={d?.isCurrent ? "fill-foreground" : "fill-muted-foreground"}
                >
                  {d?.label}
                  {showYear && (
                    <tspan x={x} dy={10} fontSize={8} fontWeight={400} className="fill-muted-foreground">
                      &apos;{currYear.slice(2)}
                    </tspan>
                  )}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null;
              const d = data.find((d) => d.monthKey === label);
              return (
                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-sm text-xs">
                  <p className="text-muted-foreground mb-1">{d?.label ?? label}</p>
                  <p className="font-medium tabular-nums text-popover-foreground">
                    {fmtCurrency(payload[0].value as number)}
                  </p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="net"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#areaGradient)"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, fill: "currentColor", stroke: "white", strokeWidth: 1.5 }}
          />

          {current && (
            <ReferenceDot
              x={current.monthKey}
              y={current.net}
              r={4}
              fill="currentColor"
              stroke="white"
              strokeWidth={1.5}
            />
          )}

          <ReferenceDot
            x={peak.monthKey}
            y={peak.net}
            r={0}
            label={{
              value: fmtCurrency(peak.net),
              position: "top",
              fontSize: 9,
              fontWeight: 500,
              className: "fill-foreground tabular-nums",
            }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
});

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
      className="bg-input-bg"
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
                  <Badge variant="warning" size="sm" className="font-normal">
                    Matured
                  </Badge>
                )}
                {isCurrent && isSettled && (
                  <Badge variant="success" size="sm" className="font-normal">
                    Settled
                  </Badge>
                )}
                {entry.status === "closed" && (
                  <Badge variant="alert" size="sm" className="font-normal">
                    Closed
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
  const displayEntries = isCurrent ? (currentMonthFull?.entries ?? month.entries) : month.entries;
  const displayNet = isCurrent ? (currentMonthFull?.net ?? month.net) : month.net;

  const maturityEntries = displayEntries.filter((e) => e.payoutFrequency === "maturity");
  const monthlyEntries = displayEntries.filter((e) => e.payoutFrequency === "monthly");

  return (
    <CollapsibleCard
      defaultOpen={isCurrent}
      triggerClassName="text-sm font-medium"
      contentClassName="py-2 pr-10 space-y-stack-md"
      trigger={
        <span className="flex flex-1 items-center justify-between mr-2">
          <span className="flex flex-wrap items-center gap-stack-xs">
            <span>{month.label}</span>
            {isCurrent && (
              <Badge variant="info" className="font-normal">
                Current month
              </Badge>
            )}
          </span>
          <span className={cn("tabular-nums", isCurrent && "text-base font-semibold text-accent-fg")}>
            {fmtCurrency(displayNet)}
          </span>
        </span>
      }
    >
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
    </CollapsibleCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CashFlowViewProps {
  monthlyAllowance: MonthlyAllowance[];
  currentMonthFull: MonthlyAllowance | null;
}

export function CashFlowView({ monthlyAllowance, currentMonthFull }: CashFlowViewProps) {
  const { fmtCurrency } = useFormatterContext();
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
    <div className="space-y-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-stack-md">
        <p className="flex gap-1 items-center text-xs text-muted-foreground">
          <Info className="shrin-0" size="13" aria-hidden="true" />
          All amounts are net of withholding tax
        </p>
        <WindowFilter value={window} onChange={setWindow} />
      </div>
      <AreaChart months={slicedMonths} currentMonthKey={currentMonthKey} currentMonthFull={currentMonthFull} fmtCurrency={fmtCurrency} />
      <div className="space-y-stack-sm">
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
