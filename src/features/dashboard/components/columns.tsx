"use client";

import { type ColumnDef, type Column, type RowData } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhpCurrency } from "@/lib/domain/format";
import { formatDate, differenceInCalendarDays, parseLocalDate } from "@/lib/domain/date";
import type { EnrichedSummary } from "@/features/dashboard/hooks/usePortfolioData";
import type { TimeDeposit } from "@/types";

// ─── TableMeta augmentation ───────────────────────────────────────────────────

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    onSettleClick: (summary: EnrichedSummary) => void;
    onDelete: (id: string) => void;
    onEdit: (deposit: TimeDeposit) => void;
  }
}

// ─── Sortable header component ────────────────────────────────────────────────

function SortableHeader({ column, label }: { column: Column<EnrichedSummary>; label: string }) {
  const sorted = column.getIsSorted();
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 opacity-40" />
      )}
    </span>
  );
}

// ─── Days-to-maturity helper ──────────────────────────────────────────────────

function DaysCell({ maturityDate }: { maturityDate: string | null }) {
  if (!maturityDate) return <span className="text-muted-foreground">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(parseLocalDate(maturityDate), today);

  /* TODO: Replace color tokens */
  if (days > 30) return <span>{days}d</span>;
  if (days > 0)
    return <span className="font-medium text-status-warning-fg">{days}d</span>;
  if (days === 0)
    return <span className="font-medium text-status-warning-fg">Today</span>;
  return (
    <span className="font-medium text-status-warning-fg">{Math.abs(days)}d ago</span>
  );
}

// ─── Column definitions ────────────────────────────────────────────────────────

export const columns: ColumnDef<EnrichedSummary>[] = [
  // 1. Deposit (name + bank) — frozen first column
  {
    id: "deposit",
    accessorFn: (row) => row.deposit.name,
    header: ({ column }) => <SortableHeader column={column} label="Deposit" />,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => {
      const { deposit, bank } = row.original;
      return (
        <div>
          <p className="text-sm font-medium">{deposit.name}</p>
          <p className="text-xs text-muted-foreground">{bank.name}</p>
        </div>
      );
    },
  },

  // 2. Principal
  {
    id: "principal",
    accessorFn: (row) => row.deposit.principal,
    header: ({ column }) => <SortableHeader column={column} label="Principal" />,
    enableSorting: true,
    sortingFn: "basic",
    cell: ({ row }) => formatPhpCurrency(row.original.deposit.principal),
  },

  // 3. Rate
  {
    id: "rate",
    accessorFn: (row) =>
      row.deposit.interestMode === "tiered" ? -1 : row.deposit.flatRate,
    header: ({ column }) => <SortableHeader column={column} label="Rate" />,
    enableSorting: true,
    sortingFn: (a, b) => {
      const aRate = a.original.deposit.interestMode === "tiered" ? -1 : a.original.deposit.flatRate;
      const bRate = b.original.deposit.interestMode === "tiered" ? -1 : b.original.deposit.flatRate;
      return aRate - bRate;
    },
    cell: ({ row }) => {
      const { deposit } = row.original;
      if (deposit.interestMode === "tiered") return <span className="text-muted-foreground">Tiered</span>;
      return `${(deposit.flatRate * 100).toFixed(2)}%`;
    },
  },

  // 4. Maturity date
  {
    id: "maturityDate",
    accessorFn: (row) => row.maturityDate ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Matures" />,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => {
      const { maturityDate, deposit } = row.original;
      if (deposit.isOpenEnded) return <span className="text-muted-foreground">Open-ended</span>;
      if (!maturityDate) return <span className="text-muted-foreground">—</span>;
      return formatDate(parseLocalDate(maturityDate));
    },
  },

  // 5. Days to maturity (default sort)
  {
    id: "daysToMaturity",
    accessorFn: (row) => {
      if (!row.maturityDate || row.deposit.isOpenEnded || row.effectiveStatus === "settled")
        return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return differenceInCalendarDays(parseLocalDate(row.maturityDate), today);
    },
    header: ({ column }) => <SortableHeader column={column} label="Days left" />,
    enableSorting: true,
    sortingFn: (a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const getVal = (s: EnrichedSummary): number => {
        if (!s.maturityDate || s.deposit.isOpenEnded || s.effectiveStatus === "settled")
          return Infinity;
        return differenceInCalendarDays(parseLocalDate(s.maturityDate), today);
      };

      return getVal(a.original) - getVal(b.original);
    },
    cell: ({ row }) => {
      const { maturityDate, deposit, effectiveStatus } = row.original;
      if (deposit.isOpenEnded || effectiveStatus === "settled")
        return <span className="text-muted-foreground">—</span>;
      return <DaysCell maturityDate={maturityDate} />;
    },
  },

  // 6. Net interest
  {
    id: "netInterest",
    accessorFn: (row) => row.netInterest,
    header: ({ column }) => <SortableHeader column={column} label="Net interest" />,
    enableSorting: true,
    sortingFn: "basic",
    cell: ({ row }) => {
      return <span className="text-primary dark:text-primary-subtle font-semibold">{ formatPhpCurrency(row.original.netInterest) }</span>
    },
  },

  // 7. Payout frequency
  {
    id: "payoutFrequency",
    accessorFn: (row) => row.deposit.payoutFrequency,
    header: ({ column }) => <SortableHeader column={column} label="Payout" />,
    enableSorting: true,
    sortingFn: (a, b) => {
      const weight = (freq: string) => (freq === "monthly" ? 0 : 1);
      return (
        weight(a.original.deposit.payoutFrequency) -
        weight(b.original.deposit.payoutFrequency)
      );
    },
    cell: ({ row }) => {
      const freq = row.original.deposit.payoutFrequency;
      return freq === "monthly" ? "Monthly" : "At maturity";
    },
  },

  // 8. Status
  {
    id: "status",
    accessorFn: (row) => row.effectiveStatus,
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    enableSorting: true,
    sortingFn: (a, b) => {
      const weight = (s: EnrichedSummary) => {
        if (s.effectiveStatus === "matured") return 0;
        if (s.effectiveStatus === "active") return 1;
        return 2;
      };
      return weight(a.original) - weight(b.original);
    },
    cell: ({ row }) => {
      const status = row.original.effectiveStatus;
      if (status === "settled")
        return <Badge variant="success">Settled</Badge>;
      if (status === "matured")
        return <Badge variant="warning">Matured</Badge>;
      return <Badge variant="secondary">Active</Badge>;
    },
  },

  // 9. Actions
  {
    id: "actions",
    header: () => <span className="block text-right">Actions</span>,
    enableSorting: false,
    cell: ({ row, table }) => {
      const summary = row.original;
      const { effectiveStatus, deposit } = summary;
      const { onSettleClick, onDelete, onEdit } = table.options.meta!;

      return (
        <div className="flex items-center justify-end">
          {effectiveStatus === "matured" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-r-none"
              onClick={() => onSettleClick(summary)}
              aria-label={`Settle ${deposit.name}`}
            >
              Settle
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={
                  effectiveStatus === "matured"
                    ? "rounded-l-none border-l-0 px-2"
                    : "px-2"
                }
                aria-label={`More options for ${deposit.name}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(deposit)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(deposit.id)}
              >
                <Trash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
