"use client";

import { MoreHorizontal, Pencil, Trash, Undo2, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { TimeDeposit } from "@/types";

type Props = {
  summary: EnrichedSummary;
  onSettle: (summary: EnrichedSummary) => void;
  onUnsettle: (id: string) => void;
  onClose: (summary: EnrichedSummary) => void;
  onReopen: (id: string) => void;
  onEdit: (deposit: TimeDeposit) => void;
  onDelete: (summary: EnrichedSummary) => void;
};

export function DepositActions({
  summary,
  onSettle,
  onUnsettle,
  onClose,
  onReopen,
  onEdit,
  onDelete,
}: Props) {
  const { deposit, effectiveStatus } = summary;

  return (
    <div className="flex items-center justify-end">
      {effectiveStatus === "matured" && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-r-none"
          onClick={() => onSettle(summary)}
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
          {effectiveStatus === "settled" && (
            <DropdownMenuItem onClick={() => onUnsettle(deposit.id)}>
              <Undo2 />
              Undo settle
            </DropdownMenuItem>
          )}
          {effectiveStatus === "closed" && (
            <DropdownMenuItem onClick={() => onReopen(deposit.id)}>
              <RefreshCw />
              Reopen
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onEdit(deposit)}>
            <Pencil />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {effectiveStatus === "active" && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onClose(summary)}
            >
              <X />
              {deposit.isOpenEnded ? "Withdraw & close" : "Close early"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(summary)}
          >
            <Trash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
