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
import { formatPhpCurrency } from "@/lib/domain/format";
import { monthKey } from "@/lib/domain/date";
import { cn } from "@/lib/utils";
import type { MonthlyAllowance } from "@/types";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from "@/features/dashboard/components/EmptyState";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BAR_HEIGHT = 160;
const MIN_BAR_HEIGHT = 4;

type Window = "3" | "6" | "12" | "all";

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  months,
  currentMonthKey,
  currentMonthFull,
}: {
  months: MonthlyAllowance[];
  currentMonthKey: string;
  currentMonthFull: MonthlyAllowance | null;
}) {
  const effectiveNet = (m: MonthlyAllowance) =>
    m.monthKey === currentMonthKey && currentMonthFull != null
      ? currentMonthFull.net
      : m.net;

  const maxNet = Math.max(...months.map(effectiveNet), 1);
  const maxMonth = months.reduce(
    (acc, m) => (effectiveNet(m) > effectiveNet(acc) ? m : acc),
    months[0],
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-max px-1 pb-2 pt-8">
        {months.map((month) => {
          const displayNet = effectiveNet(month);
          const barHeight = Math.max(
            (displayNet / maxNet) * MAX_BAR_HEIGHT,
            MIN_BAR_HEIGHT,
          );
          const shortLabel = format(
            parseISO(month.monthKey + "-01"),
            "MMM ''yy",
          );
          const isCurrent = month.monthKey === currentMonthKey;
          const isTallest = month.monthKey === maxMonth?.monthKey;

          return (
            <div
              key={month.monthKey}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  !isCurrent && !isTallest && "invisible",
                )}
              >
                {formatPhpCurrency(displayNet)}
              </span>
              <div
                className={cn(
                  "w-8 rounded-t",
                  isCurrent ? "bg-primary" : "bg-primary/60",
                )}
                style={{ height: barHeight }}
              />
              <span
                className={cn(
                  "text-xs",
                  isCurrent
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {shortLabel}
              </span>
            </div>
          );
        })}
      </div>
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
      variant="outline"
      size="lg"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as Window);
      }}
      className="h-7"
    >
      <ToggleGroupItem value="3" className="text-xs px-2.5 h-7">
        3M
      </ToggleGroupItem>
      <ToggleGroupItem value="6" className="text-xs px-2.5 h-7">
        6M
      </ToggleGroupItem>
      <ToggleGroupItem value="12" className="text-xs px-2.5 h-7">
        12M
      </ToggleGroupItem>
      <ToggleGroupItem value="all" className="text-xs px-2.5 h-7">
        All
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

// ─── Monthly breakdown row ────────────────────────────────────────────────────

type AllowanceEntry = MonthlyAllowance["entries"][number];

function EntryGroup({
  label,
  entries,
  isCurrent,
}: {
  label: string;
  entries: AllowanceEntry[];
  isCurrent: boolean;
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
                  <Badge variant="destructive" className="text-xs h-4 font-normal">
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
                  {formatPhpCurrency(entry.amountNet)}
                </span>
              </span>
            </div>
            {(entry.principalReturned ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                +{formatPhpCurrency(entry.principalReturned!)} principal
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
}: {
  month: MonthlyAllowance;
  isCurrent: boolean;
  currentMonthFull: MonthlyAllowance | null;
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
                {formatPhpCurrency(displayNet)}
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
            />
            <EntryGroup
              label="Monthly payouts"
              entries={monthlyEntries}
              isCurrent={isCurrent}
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
      <BarChart months={slicedMonths} currentMonthKey={currentMonthKey} currentMonthFull={currentMonthFull} />
      <div className="space-y-3">
        {slicedMonths.map((month) => (
          <MonthRow
            key={month.monthKey}
            month={month}
            isCurrent={month.monthKey === currentMonthKey}
            currentMonthFull={currentMonthFull}
          />
        ))}
      </div>
    </div>
  );
}
