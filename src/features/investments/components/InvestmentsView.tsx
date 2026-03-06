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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GanttChart, LayoutList, Wallet, SearchX, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { createColumns } from "./columns";
import { usePortfolioContext } from "@/features/portfolio/context/PortfolioContext";
import { DepositCard } from "./DepositCard";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SettleConfirmDialog } from "./SettleConfirmDialog";
import { EmptyState } from "@/features/dashboard/components/EmptyState";
import { LadderView } from "./LadderView";
import { BankActiveSummary } from "./BankActiveSummary";
import { cn } from "@/lib/utils";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  summaries: EnrichedSummary[];
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (deposit: TimeDeposit) => void;
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

export function InvestmentsView({ summaries, onSettle, onDelete, onEdit, highlightedId }: Props) {
  const { fmtCurrency } = usePortfolioContext();
  const columns = useMemo(() => createColumns(fmtCurrency), [fmtCurrency]);
  const [view, setView] = useState<"list" | "ladder">("list");
  const [showSettled, setShowSettled] = useState(false);
  const [bankFilter, setBankFilter] = useState("all");
  const [settleTarget, setSettleTarget] = useState<EnrichedSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSummary | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "daysToMaturity", desc: false }]);
  const [summaryOpen, setSummaryOpen] = useState(false);
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

  // Active-only summaries for bank summary strip (ignores showSettled toggle)
  const activeSummaries = useMemo(() => {
    let list = summaries.filter((s) => s.effectiveStatus === "active");
    if (bankFilter !== "all") list = list.filter((s) => s.bank.id === bankFilter);
    return list;
  }, [summaries, bankFilter]);

  const activeTotals = useMemo(
    () => ({
      principal: activeSummaries.reduce((sum, s) => sum + s.deposit.principal, 0),
      netInterest: activeSummaries.reduce((sum, s) => sum + s.netInterest, 0),
    }),
    [activeSummaries],
  );

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
      onEdit,
    },
  });

  const noDeposits = summaries.length === 0;
  const noResults = summaries.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-stack-lg">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-stack-md">
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

        <div className="flex items-center gap-stack-xs">
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

        <ToggleGroup
          type="single"
          variant="card"
          value={view}
          onValueChange={(v) => v && setView(v as "list" | "ladder")}
          className="ml-auto"
        >
          <ToggleGroupItem value="list" className="gap-1.5 px-3">
            <LayoutList size={14} />
            <span>List</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="ladder" className="gap-1.5 px-3">
            <GanttChart size={14} />
            <span>Ladder</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Bank active summary — collapsible, defaults closed */}
      {!noDeposits && activeSummaries.length > 0 && (
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-card-x py-2.5 text-sm hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-stack-sm">
              <span className="font-medium">Active summary</span>
              <span className="text-muted-foreground tabular-nums text-xs">
                {fmtCurrency(activeTotals.principal)} principal
                {" · "}
                <span className="text-accent-fg">{fmtCurrency(activeTotals.netInterest)}</span>
                {" net interest"}
              </span>
            </div>
            <ChevronDown
              className={cn("size-4 text-muted-foreground transition-transform duration-200", summaryOpen && "rotate-180")}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-stack-xs">
            <BankActiveSummary summaries={activeSummaries} />
          </CollapsibleContent>
        </Collapsible>
      )}

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
      ) : view === "ladder" ? (
        <LadderView summaries={filtered} />
      ) : isMd ? (
        /* ── Desktop table (horizontally scrollable, Deposit column frozen) ── */
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDeposit = header.column.id === "deposit";
                    const isRowIndex = header.column.id === "rowIndex";
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
                          isDeposit ? "sticky left-0 z-10 bg-table-frozen-bg border-r" : "",
                          isRowIndex ? "border-r text-muted-foreground" : "",
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
                    "bg-card transition-colors",
                    row.original.deposit.id === highlightedId
                      ? "bg-primary/10 duration-1000"
                      : "duration-150",
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isDeposit = cell.column.id === "deposit";
                    const isRowIndex = cell.column.id === "rowIndex";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          isDeposit ? "sticky left-0 z-10 bg-table-frozen-bg border-r" : "",
                          isRowIndex ? "border-r bg-muted/60" : "",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              {table.getFooterGroups().map((footerGroup) => (
                <TableRow key={footerGroup.id}>
                  {footerGroup.headers.map((header) => {
                    const isDeposit = header.column.id === "deposit";
                    const isRowIndex = header.column.id === "rowIndex";
                    return (
                      <TableCell
                        key={header.id}
                        className={cn(
                          isDeposit ? "sticky left-0 z-10 bg-table-frozen-bg border-r" : "",
                          isRowIndex ? "border-r" : "",
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.footer, header.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableFooter>
          </Table>
        </div>
      ) : (
        /* ── Mobile cards (single column with group headers) ── */
        <div className="space-y-stack-lg">
          {groups.map(({ key, label, items }) => (
            <div key={key} className="space-y-stack-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <ul role="list" className="space-y-stack-sm">
                {items.map((s) => (
                  <DepositCard
                    key={s.deposit.id}
                    summary={s}
                    onSettleClick={handleSettleClick}
                    onDeleteClick={handleDeleteRequest}
                    onEditClick={onEdit}
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
