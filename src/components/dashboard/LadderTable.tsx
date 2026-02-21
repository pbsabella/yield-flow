import { useState } from "react";
import type { DepositSummary } from "@/lib/types";
import { differenceInCalendarDays, formatDate } from "@/lib/domain/date";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
} from "lucide-react";
import TimelineBadge from "@/components/dashboard/TimelineBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const currency = "PHP";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

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
  const today = new Date();
  const [sortKey, setSortKey] = useState<
    "maturity" | "principal" | "net" | "days" | "bank"
  >("maturity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function getDaysToMaturity(dateISO: string) {
    const days = differenceInCalendarDays(new Date(dateISO), today);
    return days;
  }

  function formatDaysToMaturity(days: number) {
    if (days < 0) return "Past due";
    if (days === 0) return "Due today";
    return `${days} days`;
  }

  const sorted = [...summaries].sort((a, b) => {
    if (sortKey === "bank") {
      const nameA = a.bank.name.toLowerCase();
      const nameB = b.bank.name.toLowerCase();
      if (nameA === nameB) return 0;
      return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    }
    const daysA = getDaysToMaturity(a.maturityDate);
    const daysB = getDaysToMaturity(b.maturityDate);
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => toggleSort("bank")}
                >
                  Bank
                  {sortKey === "bank" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-muted h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => toggleSort("principal")}
                >
                  Principal
                  {sortKey === "principal" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-muted h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => toggleSort("maturity")}
                >
                  Maturity
                  {sortKey === "maturity" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-muted h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => toggleSort("days")}
                >
                  Days
                  {sortKey === "days" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-muted h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-primary/60 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => toggleSort("net")}
                >
                  Net interest
                  {sortKey === "net" ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronsUpDown className="text-muted h-3 w-3" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((summary) => {
              const days = getDaysToMaturity(summary.maturityDate);
              const isDue = days <= 0 && !summary.deposit.isOpenEnded;
              const isMatured = summary.deposit.status === "matured";
              return (
                <TableRow
                  key={summary.deposit.id}
                  className={isDue ? "bg-amber-50/60 dark:bg-amber-500/10" : undefined}
                >
                  <TableCell className="font-semibold">{summary.deposit.name}</TableCell>
                  <TableCell className="text-sky-700 dark:text-sky-400">
                    {summary.bank.name}
                  </TableCell>
                  <TableCell className="font-financial">
                    {formatCurrency(summary.deposit.principal)}
                  </TableCell>
                  <TableCell>
                    {summary.deposit.isOpenEnded ? (
                      <span className="text-muted text-sm font-semibold">Open-ended</span>
                    ) : (
                      <span className="font-financial text-foreground">
                        {formatDate(new Date(summary.maturityDate))}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TimelineBadge
                      label={
                        summary.deposit.isOpenEnded
                          ? "Ongoing"
                          : formatDaysToMaturity(days)
                      }
                      className={isDue ? "text-amber-700 dark:text-amber-200" : undefined}
                    />
                  </TableCell>
                  <TableCell className="font-financial font-semibold text-indigo-700 dark:text-indigo-400">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {formatCurrency(summary.netInterest)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isDue ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isMatured}
                          onClick={() => onMarkMatured(summary.deposit.id)}
                        >
                          Settle
                        </Button>
                      ) : null}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
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
                              className="justify-start text-rose-700 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
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
      <div className="space-y-3 md:hidden">
        {sorted.map((summary) => {
          const days = getDaysToMaturity(summary.maturityDate);
          const isDue = days <= 0 && !summary.deposit.isOpenEnded;
          const isMatured = summary.deposit.status === "matured";
          return (
            <Collapsible
              key={summary.deposit.id}
              className={`group border-subtle bg-surface-soft rounded-xl border p-4 transition-colors duration-200 ease-out ${
                isDue ? "bg-amber-50/60 dark:bg-amber-500/10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{summary.deposit.name}</p>
                  <p className="text-xs text-sky-700 dark:text-sky-400">
                    {summary.bank.name}
                  </p>
                </div>
                <CollapsibleTrigger className="font-financial flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  <TrendingUp className="h-4 w-4" />
                  {formatCurrency(summary.netInterest)}
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="text-muted mt-4 grid gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Principal</span>
                  <span className="text-primary font-financial">
                    {formatCurrency(summary.deposit.principal)}
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
                  <TimelineBadge
                    label={
                      summary.deposit.isOpenEnded ? "Ongoing" : formatDaysToMaturity(days)
                    }
                    className={isDue ? "text-amber-700 dark:text-amber-200" : undefined}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Gross interest</span>
                  <span className="text-primary font-financial">
                    {formatCurrency(summary.grossInterest)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {isDue ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      disabled={isMatured}
                      onClick={() => onMarkMatured(summary.deposit.id)}
                    >
                      Settle
                    </Button>
                  ) : null}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" className="h-9 w-9 p-0">
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
                          className="justify-start text-rose-700 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
                          onClick={() => onDeleteRequest(summary.deposit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
