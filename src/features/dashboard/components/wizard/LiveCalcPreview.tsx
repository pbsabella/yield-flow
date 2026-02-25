"use client";

import { useEffect, useRef, useState } from "react";
import { calculateNetYield } from "@/lib/domain/yield-engine";
import type { YieldInput } from "@/lib/domain/yield-engine";
import { formatPhpCurrency } from "@/lib/domain/format";

interface LiveCalcPreviewProps {
  input: YieldInput | null;
  /** compact=true renders as a single-line strip for mobile */
  compact?: boolean;
}

type CalcResult = {
  netInterest: number;
  netTotal: number;
  maturityDate: string | null; // null = open-ended
  taxRate: number;
};

const DEBOUNCE_MS = 300;

export function LiveCalcPreview({ input, compact = false }: LiveCalcPreviewProps) {
  const [result, setResult] = useState<CalcResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!input) {
      timerRef.current = setTimeout(() => setResult(null), DEBOUNCE_MS);
      return;
    }

    timerRef.current = setTimeout(() => {
      try {
        const { netInterest, maturityDate } = calculateNetYield(input);
        setResult({
          netInterest,
          netTotal: input.principal + netInterest,
          maturityDate: input.termMonths === 12 && !maturityDate ? null : maturityDate,
          taxRate: input.taxRate,
        });
      } catch {
        setResult(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [input]);

  if (compact) {
    return (
      <div
        aria-live="polite"
        aria-label="Live calculation preview"
        className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground transition-all"
      >
        {result ? (
          <span className="text-foreground font-medium">
            Net {formatPhpCurrency(result.netInterest)}
            <span className="text-muted-foreground font-normal">
              {" · "}
              {result.maturityDate
                ? `Matures ${new Date(result.maturityDate + "T00:00:00").toLocaleDateString("en-PH", { month: "short", year: "numeric" })}`
                : "Open-ended"}
            </span>
          </span>
        ) : (
          <span>Fill in investment details to see your projected return</span>
        )}
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      aria-label="Live calculation preview"
      className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Calculation Preview
      </p>

      {result ? (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Net interest</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatPhpCurrency(result.netInterest)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Matures</p>
              <p className="text-sm font-medium">
                {result.maturityDate
                  ? new Date(result.maturityDate + "T00:00:00").toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Open-ended"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net total</p>
              <p className="text-sm font-medium tabular-nums">
                {formatPhpCurrency(result.netTotal)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-3">
            Gross × (1 − {Math.round(result.taxRate * 100)}% tax) = net — what you actually keep
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Fill in investment details to see your projected return.
        </p>
      )}
    </div>
  );
}
