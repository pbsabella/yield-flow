"use client";
// Opt out of React Compiler memoization: useReactTable() returns unstable
// function references that the compiler cannot safely cache.
"use no memo";

import { useCallback, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { columns } from "@/features/dashboard/components/columns";
import { DepositCard } from "@/features/dashboard/components/DepositCard";
import { DeleteConfirmDialog } from "@/features/dashboard/components/DeleteConfirmDialog";
import { SettleConfirmDialog } from "@/features/dashboard/components/SettleConfirmDialog";
import { Wallet, SearchX } from "lucide-react";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/dashboard/hooks/usePortfolioData";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  summaries: EnrichedSummary[];
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
  highlightedId?: string | null;
};

// ─── Sort order for card view ─────────────────────────────────────────────────

function statusSortWeight(s: EnrichedSummary): number {
  if (s.effectiveStatus === "matured") return 0;
  if (s.effectiveStatus === "active" && !s.deposit.isOpenEnded) return 1;
  if (s.effectiveStatus === "active" && s.deposit.isOpenEnded) return 2;
  return 3; // settled
}

function sortSummaries(list: EnrichedSummary[]): EnrichedSummary[] {
  return [...list].sort((a, b) => {
    const wa = statusSortWeight(a);
    const wb = statusSortWeight(b);
    if (wa !== wb) return wa - wb;

    // Within settled: DESC by maturityDate
    if (a.effectiveStatus === "settled" && b.effectiveStatus === "settled") {
      if (!a.maturityDate) return 1;
      if (!b.maturityDate) return -1;
      return b.maturityDate.localeCompare(a.maturityDate);
    }

    // Within active/matured: ASC by maturityDate, nulls last
    if (!a.maturityDate) return 1;
    if (!b.maturityDate) return -1;
    return a.maturityDate.localeCompare(b.maturityDate);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InvestmentsTab({ summaries, onSettle, onDelete, highlightedId }: Props) {
  const [showSettled, setShowSettled] = useState(false);
  const [bankFilter, setBankFilter] = useState("all");
  const [settleTarget, setSettleTarget] = useState<EnrichedSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSummary | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "daysToMaturity", desc: false }]);
  const [announcement, setAnnouncement] = useState("");

  const isMd = useMediaQuery("(min-width: 768px)");

  // Unique banks from summaries for filter
  const bankOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of summaries) seen.set(s.bank.id, s.bank.name);
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [summaries]);

  // Filtered summaries
  const filtered = useMemo(() => {
    let list = summaries;
    if (!showSettled) list = list.filter((s) => s.effectiveStatus !== "settled");
    if (bankFilter !== "all") list = list.filter((s) => s.bank.id === bankFilter);
    return list;
  }, [summaries, showSettled, bankFilter]);

  // For card view: sorted filtered list
  const sortedForCards = useMemo(() => sortSummaries(filtered), [filtered]);

  // Card view groups
  const groups = useMemo(
    () =>
      [
        {
          key: "matured",
          label: "Matured",
          items: sortedForCards.filter((s) => s.effectiveStatus === "matured"),
        },
        {
          key: "active",
          label: "Active",
          items: sortedForCards.filter(
            (s) => s.effectiveStatus === "active" && !s.deposit.isOpenEnded,
          ),
        },
        {
          key: "open-ended",
          label: "Open-ended",
          items: sortedForCards.filter(
            (s) => s.effectiveStatus === "active" && s.deposit.isOpenEnded,
          ),
        },
        {
          key: "settled",
          label: "Settled",
          items: sortedForCards.filter((s) => s.effectiveStatus === "settled"),
        },
      ].filter((g) => g.items.length > 0),
    [sortedForCards],
  );

  const handleSettleClick = useCallback((summary: EnrichedSummary) => {
    setSettleTarget(summary);
  }, []);

  const handleSettleConfirm = useCallback(
    (id: string) => {
      onSettle(id);
      const name = settleTarget?.deposit.name ?? "";
      setSettleTarget(null);
      setAnnouncement(`${name} marked as settled.`);
    },
    [onSettle, settleTarget],
  );

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const target = summaries.find((s) => s.deposit.id === id) ?? null;
      setDeleteTarget(target);
    },
    [summaries],
  );

  const handleDeleteConfirm = useCallback(
    (id: string) => {
      onDelete(id);
      setDeleteTarget(null);
    },
    [onDelete],
  );

  // TanStack table instance (desktop only)
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      onSettleClick: handleSettleClick,
      onDelete: handleDeleteRequest,
    },
  });

  const noDeposits = summaries.length === 0;
  const noResults = summaries.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger aria-label="Filter bank" className="w-44">
            <SelectValue placeholder="All banks" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="all">All banks</SelectItem>
              {bankOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="show-settled"
            checked={showSettled}
            onCheckedChange={setShowSettled}
            size="default"
          />
          <Label htmlFor="show-settled" className="text-sm cursor-pointer select-none">
            Show settled
          </Label>
        </div>
      </div>

      {/* Content */}
      {noDeposits ? (
        <EmptyState
          icon={Wallet}
          title="No investments tracked yet"
          description="Add your first time deposit or savings account to start tracking your yield ladder."
          action={{ label: "+ Add investment", disabled: true }}
        />
      ) : noResults ? (
        <EmptyState
          icon={SearchX}
          title="No matching deposits"
          description="Try adjusting the bank filter or enabling settled deposits."
          action={{ label: "Clear filters", onClick: () => setBankFilter("all") }}
        />
      ) : isMd ? (
        /* ── Desktop table (horizontally scrollable, Deposit column frozen) ── */
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDeposit = header.column.id === "deposit";
                    return (
                      <TableHead
                        key={header.id}
                        onClick={
                          header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                        className={[
                          header.column.getCanSort() ? "cursor-pointer select-none" : "",
                          isDeposit ? "sticky left-0 z-10 bg-background border-r" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "transition-colors duration-1000",
                    row.original.deposit.id === highlightedId && "bg-primary/10",
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isDeposit = cell.column.id === "deposit";
                    return (
                      <TableCell
                        key={cell.id}
                        className={
                          isDeposit ? "sticky left-0 z-10 bg-background border-r" : ""
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* ── Mobile cards (single column with group headers) ── */
        <div className="space-y-6">
          {groups.map(({ key, label, items }) => (
            <div key={key} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <ul role="list" className="space-y-3">
                {items.map((s) => (
                  <DepositCard
                    key={s.deposit.id}
                    summary={s}
                    onSettleClick={handleSettleClick}
                    onDeleteClick={handleDeleteRequest}
                    isNew={s.deposit.id === highlightedId}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Settle dialog */}
      <SettleConfirmDialog
        summary={settleTarget}
        open={settleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSettleTarget(null);
        }}
        onConfirm={handleSettleConfirm}
      />

      {/* Delete dialog */}
      <DeleteConfirmDialog
        summary={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
