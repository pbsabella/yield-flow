"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

// ─── Pre-computed SVG paths ────────────────────────────────────────────────────
//
// 8-month dataset (Aug–Mar): [14200, 18900, 12400, 22100, 16800, 18750, 18750, 31500]
// Constants: MONTH_WIDTH=48, HEIGHT=120, PAD_TOP=20, PAD_BOTTOM=20, PAD_X=20
// maxNet=31500, plotHeight=80, baselineY=100
//
// Points (x, y):
//   Aug: (44, 64)  Sep: (92, 52)  Oct: (140, 69)  Nov: (188, 44)
//   Dec: (236, 57) Jan: (284, 52) Feb: (332, 52)  Mar: (380, 20)
//
// smoothCurve: between pts[i] and pts[i+1], cpX = (curr.x + next.x) / 2
//   C cpX,curr.y cpX,next.y next.x,next.y

const LINE_PATH =
  "M 44,64 C 68,64 68,52 92,52 C 116,52 116,69 140,69 C 164,69 164,44 188,44 C 212,44 212,57 236,57 C 260,57 260,52 284,52 C 308,52 308,52 332,52 C 356,52 356,20 380,20";

const AREA_PATH = `${LINE_PATH} L 380,100 L 44,100 Z`;

const X_LABELS: { x: number; label: string; bold?: boolean }[] = [
  { x: 44, label: "Aug" },
  { x: 92, label: "Sep" },
  { x: 140, label: "Oct" },
  { x: 188, label: "Nov" },
  { x: 236, label: "Dec" },
  { x: 284, label: "Jan" },
  { x: 332, label: "Feb" },
  { x: 380, label: "Mar", bold: true },
];

// ─── Card data ─────────────────────────────────────────────────────────────────

const CARDS = [
  { bank: "First National", amount: "$50,000", term: "6 months", daysLabel: null, warn: false },
  { bank: "Metro Savings", amount: "$100,000", term: "12 months", daysLabel: null, warn: false },
  { bank: "Heritage Bank", amount: "$25,000", term: "3 months", daysLabel: "14 days", warn: true },
  { bank: "Summit Trust", amount: "$150,000", term: "24 months", daysLabel: null, warn: false },
] as const;

// ─── Animation phases ──────────────────────────────────────────────────────────
//
//  Phase 0 → invisible (brief reset before loop)
//  Phase 1 → cards stagger in        (t=100ms)
//  Phase 2 → Heritage highlight +    (t=2200ms)
//             maturity banner
//  Phase 3 → chart sweeps in         (t=3700ms)
//  Loop restart at t=7000ms
//
//  prefers-reduced-motion: skip to phase 3 immediately, no loop.

type Phase = 0 | 1 | 2 | 3;

function AnimationScene({ reduced }: { reduced: boolean }) {
  const [phase, setPhase] = useState<Phase>(reduced ? 3 : 0);

  useEffect(() => {
    if (reduced) return;
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reduced]);

  return (
    <div className="select-none p-4 space-y-3" aria-hidden="true">
      {/* Act 1 — Portfolio cards */}
      <div className="grid grid-cols-2 gap-2">
        {CARDS.map((card, i) => {
          const highlighted = card.warn && phase >= 2;
          return (
            <div
              key={card.bank}
              className={[
                "rounded-xl border p-3",
                highlighted
                  ? "border-status-warning-border bg-status-warning-bg"
                  : "border-border bg-background",
                reduced ? "" : "transition-colors duration-500",
              ].join(" ")}
              style={{
                opacity: phase >= 1 ? 1 : 0,
                transform: phase >= 1 ? "translateY(0)" : "translateY(10px)",
                transition: reduced
                  ? "none"
                  : `opacity 0.4s ease ${i * 100}ms, transform 0.4s ease ${i * 100}ms, background-color 0.5s ease, border-color 0.5s ease`,
              }}
            >
              <p
                className={[
                  "text-xs font-medium truncate",
                  highlighted ? "text-status-warning-fg" : "text-muted-foreground",
                ].join(" ")}
              >
                {card.bank}
              </p>
              <p className="text-base font-semibold tabular-nums mt-0.5">
                {card.amount}
              </p>
              <p className="text-xs text-muted-foreground">{card.term}</p>
              {card.daysLabel && (
                <Badge
                  variant={highlighted ? "warning" : "outline"}
                  className="mt-1.5"
                >
                  {card.daysLabel}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Act 2 — Maturity alert banner */}
      <div
        className="flex items-center gap-2 rounded-lg border border-status-warning-border bg-status-warning-bg px-3 py-2 text-xs text-status-warning-fg"
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(6px)",
          transition: reduced ? "none" : "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-medium">Heritage Bank</span>
          {" matures in "}
          <Badge variant="warning" className="mx-0.5 align-middle">14 days</Badge>
          {" · $25,312 net proceeds"}
        </span>
      </div>

      {/* Act 3 — 12-month cash flow chart */}
      <div
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: reduced ? "none" : "opacity 0.3s ease",
        }}
      >
        <p className="text-xs text-muted-foreground mb-2">12-Month Cash Flow</p>
        <div
          className="overflow-hidden"
          style={{
            clipPath: phase >= 3 ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition: reduced ? "none" : "clip-path 1.2s ease-in-out",
          }}
        >
          <svg
            viewBox="0 0 424 120"
            width="100%"
            height="120"
            className="text-primary"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ldAnimGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path d={AREA_PATH} fill="url(#ldAnimGrad)" />

            {/* Stroke line */}
            <path
              d={LINE_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current month dot (Mar — peak) */}
            <circle
              cx="380"
              cy="20"
              r="4"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            />

            {/* Peak label */}
            <text
              x="380"
              y="12"
              textAnchor="middle"
              fontSize="9"
              fontWeight="500"
              className="fill-foreground tabular-nums"
            >
              $31.5k
            </text>

            {/* X-axis labels */}
            {X_LABELS.map(({ x, label, bold }) => (
              <text
                key={label}
                x={x}
                y="114"
                textAnchor="middle"
                fontSize="9"
                fontWeight={bold ? "600" : "400"}
                className={bold ? "fill-foreground" : "fill-muted-foreground"}
              >
                {label}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Public export — handles loop restart + reduced motion ────────────────────

export function LandingAnimation() {
  const reduced = useReducedMotion();
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(() => setCycleKey((k) => k + 1), 7000);
    return () => clearTimeout(timer);
  }, [cycleKey, reduced]);

  return <AnimationScene key={cycleKey} reduced={reduced} />;
}
