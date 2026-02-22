import { useMemo, useState } from "react";
import type { DepositSummary } from "@/lib/types";
import { differenceInCalendarDays, formatDate } from "@/lib/domain/date";
import { formatPhpCurrency } from "@/lib/domain/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import TimelineBadge from "@/components/dashboard/TimelineBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  summaries: DepositSummary[];
  onEdit: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onMarkMatured: (id: string) => void;
};

export default function LadderTable({
  summaries,
  onEdit,
  onDeleteRequest,
  onMarkMatured,
}: Props) {
  const todayKey = new Date().toDateString();
  const today = useMemo(() => new Date(todayKey), [todayKey]);
  const [sortKey, setSortKey] = useState<
    "maturity" | "principal" | "net" | "days" | "bank"
  >("maturity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function formatDaysToMaturity(days: number) {
    if (days < 0) return `Overdue ${Math.abs(days)} days`;
    if (days === 0) return "Due today";
    return `${days} days`;
  }

  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => {
      const statusA = a.deposit.status === "settled" ? 1 : 0;
      const statusB = b.deposit.status === "settled" ? 1 : 0;
      if (statusA !== statusB) return statusA - statusB;
      if (sortKey === "bank") {
        const nameA = a.bank.name.toLowerCase();
        const nameB = b.bank.name.toLowerCase();
        if (nameA === nameB) return 0;
        return sortDir === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      const daysA = differenceInCalendarDays(new Date(a.maturityDate), today);
      const daysB = differenceInCalendarDays(new Date(b.maturityDate), today);
      const valueA =
        sortKey === "principal"
          ? a.deposit.principal
          : sortKey === "net"
            ? a.netInterest
            : sortKey === "days"
              ? daysA
              : new Date(a.maturityDate).getTime();
      const valueB =
        sortKey === "principal"
          ? b.deposit.principal
          : sortKey === "net"
            ? b.netInterest
            : sortKey === "days"
              ? daysB
              : new Date(b.maturityDate).getTime();
      if (valueA === valueB) return 0;
      return sortDir === "asc" ? (valueA > valueB ? 1 : -1) : valueA > valueB ? -1 : 1;
    });
  }, [summaries, sortKey, sortDir, today]);

  function toggleSort(key: "maturity" | "principal" | "net" | "days" | "bank") {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  return (
    <div>
      <div className="hidden md:block">
        <div className="relative">
          <div className="from-surface pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r to-transparent" />
          <div className="from-surface pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l to-transparent" />
          <div className="border-subtle bg-surface w-full overflow-x-auto overflow-y-hidden rounded-2xl border">
            <div className="min-w-[900px]">
              <Table wrapperClassName="overflow-visible rounded-none border-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-surface-soft sticky left-0 z-20">
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-sm font-semibold">
                        Investment
                      </span>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/80 active:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2"
                        onClick={() => toggleSort("bank")}
                      >
                        Bank
                        {sortKey === "bank" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted h-3 w-3 shrink-0" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/80 active:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2"
                        onClick={() => toggleSort("principal")}
                      >
                        Principal
                        {sortKey === "principal" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted h-3 w-3 shrink-0" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/80 active:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2"
                        onClick={() => toggleSort("maturity")}
                      >
                        Maturity
                        {sortKey === "maturity" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted h-3 w-3 shrink-0" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/80 active:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2"
                        onClick={() => toggleSort("days")}
                      >
                        Days to Maturity
                        {sortKey === "days" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted h-3 w-3 shrink-0" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="text-muted-foreground hover:bg-muted/60 hover:text-foreground active:bg-muted/80 active:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-150 ease-out focus-visible:ring-2"
                        onClick={() => toggleSort("net")}
                      >
                        Net interest
                        {sortKey === "net" ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="text-muted h-3 w-3 shrink-0" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-sm font-semibold">
                        Actions
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&>tr:last-child>td:first-child]:rounded-bl-2xl">
                  {sorted.map((summary) => {
                    const days = differenceInCalendarDays(
                      new Date(summary.maturityDate),
                      today,
                    );
                    const isSettled = summary.deposit.status === "settled";
                    const isDue = days <= 0 && !summary.deposit.isOpenEnded && !isSettled;
                    const isMatured = summary.deposit.status === "matured";
                    return (
                      <TableRow
                        key={summary.deposit.id}
                        className={`${
                          isDue ? "bg-overdue [&>td]:bg-overdue" : ""
                        } ${isSettled ? "opacity-50" : ""} last:[&>td:first-child]:rounded-bl-2xl`}
                      >
                        <TableCell
                          className={`sticky left-0 z-10 font-semibold ${
                            isDue ? "bg-overdue-sticky" : "bg-surface"
                          }`}
                        >
                          {summary.deposit.name}
                        </TableCell>
                        <TableCell className="text-sky-700 dark:text-sky-400">
                          {summary.bank.name}
                        </TableCell>
                        <TableCell className="font-financial">
                          {formatPhpCurrency(summary.deposit.principal)}
                        </TableCell>
                        <TableCell>
                          {summary.deposit.isOpenEnded ? (
                            <span className="text-muted text-sm font-semibold">
                              Open-ended
                            </span>
                          ) : (
                            <span className="font-financial text-foreground">
                              {formatDate(new Date(summary.maturityDate))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {summary.deposit.isOpenEnded ? (
                            <span className="text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold">
                              —
                            </span>
                          ) : (
                            <TimelineBadge
                              label={formatDaysToMaturity(days)}
                              className={
                                isDue
                                  ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-100"
                                  : undefined
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-financial font-semibold text-indigo-700 dark:text-indigo-400">
                          {formatPhpCurrency(summary.netInterest)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isDue && isMatured ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onMarkMatured(summary.deposit.id)}
                              >
                                Settle
                              </Button>
                            ) : null}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 hover:bg-indigo-500/10 active:bg-indigo-500/20 dark:hover:bg-indigo-500/20 dark:active:bg-indigo-500/30"
                                >
                                  <MoreHorizontal
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">More actions</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-40 p-2">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="justify-start hover:bg-indigo-500/10 active:bg-indigo-500/20 dark:hover:bg-indigo-500/20 dark:active:bg-indigo-500/30"
                                    onClick={() => onEdit(summary.deposit.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="justify-start text-rose-700 hover:bg-rose-500/10 active:bg-rose-500/20 active:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-400/20 dark:active:bg-rose-400/30 dark:active:text-rose-100"
                                    onClick={() => onDeleteRequest(summary.deposit.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {sorted.map((summary) => {
          const days = differenceInCalendarDays(new Date(summary.maturityDate), today);
          const isSettled = summary.deposit.status === "settled";
          const isDue = days <= 0 && !summary.deposit.isOpenEnded && !isSettled;
          const isMatured = summary.deposit.status === "matured";
          const isOpen = openIds.has(summary.deposit.id);
          return (
            <Collapsible
              key={summary.deposit.id}
              open={isOpen}
              onOpenChange={(open) =>
                setOpenIds((current) => {
                  const next = new Set(current);
                  if (open) {
                    next.add(summary.deposit.id);
                  } else {
                    next.delete(summary.deposit.id);
                  }
                  return next;
                })
              }
              className={`group border-subtle bg-item-card rounded-xl border p-4 transition-colors duration-200 ease-out ${
                isDue ? "bg-overdue" : ""
              } ${isSettled ? "opacity-50" : ""}`}
            >
              <div
                className="hover:bg-surface/60 focus-visible:ring-primary/60 active:bg-surface-strong flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1 transition-colors duration-150 ease-out focus-visible:ring-2"
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenIds((current) => {
                    const next = new Set(current);
                    if (next.has(summary.deposit.id)) {
                      next.delete(summary.deposit.id);
                    } else {
                      next.add(summary.deposit.id);
                    }
                    return next;
                  })
                }
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setOpenIds((current) => {
                    const next = new Set(current);
                    if (next.has(summary.deposit.id)) {
                      next.delete(summary.deposit.id);
                    } else {
                      next.add(summary.deposit.id);
                    }
                    return next;
                  });
                }}
              >
                <div>
                  <p className="text-sm font-semibold">{summary.deposit.name}</p>
                  <p className="text-xs text-sky-700 dark:text-sky-400">
                    {summary.bank.name}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  {isDue && isMatured ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMarkMatured(summary.deposit.id);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      Settle
                    </Button>
                  ) : null}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 hover:bg-indigo-500/10 active:bg-indigo-500/20 dark:hover:bg-indigo-500/20 dark:active:bg-indigo-500/30"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 p-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="justify-start"
                          onClick={() => onEdit(summary.deposit.id)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="justify-start text-rose-700 hover:bg-rose-500/10 active:bg-rose-500/20 active:text-rose-800 dark:text-rose-300 dark:hover:bg-rose-400/20 dark:active:bg-rose-400/30 dark:active:text-rose-100"
                          onClick={() => onDeleteRequest(summary.deposit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-muted text-xs">
                  {summary.deposit.isOpenEnded
                    ? "Maturity —"
                    : `Maturity ${formatDate(new Date(summary.maturityDate))}`}
                </div>
                <div className="font-financial text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                  {formatPhpCurrency(summary.netInterest)}
                </div>
              </div>
              <CollapsibleContent className="text-muted mt-4 grid gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Principal</span>
                  <span className="text-primary font-financial">
                    {formatPhpCurrency(summary.deposit.principal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Maturity</span>
                  {summary.deposit.isOpenEnded ? (
                    <span className="text-muted text-xs font-semibold">Open-ended</span>
                  ) : (
                    <span className="font-financial text-foreground">
                      {formatDate(new Date(summary.maturityDate))}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Days to maturity</span>
                  {summary.deposit.isOpenEnded ? (
                    <span className="text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold">
                      —
                    </span>
                  ) : (
                    <TimelineBadge
                      label={formatDaysToMaturity(days)}
                      className={
                        isDue
                          ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-100"
                          : undefined
                      }
                    />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Net interest</span>
                  <span className="text-primary font-financial">
                    {formatPhpCurrency(summary.netInterest)}
                  </span>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
