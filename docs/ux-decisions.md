# YieldFlow — UX Decisions Log

A running record of design and UX decisions made during development.
Intended as a reference during implementation and source material for a future case study.

---

## Phase 2: Dashboard and KPI Cards

---

## Phase 3: Investments Tab

### Overview

The Investments tab is the primary data view — a scannable list of all time deposits with status, key financials, and actions. It must work well on mobile (primary use case) and provide data density on desktop.

---

### Layout Strategy: Cards on Mobile, DataTable on Desktop

**Decision:** Render `Card` components (mobile/`sm`) and switch to a shadcn `DataTable` (TanStack Table) at `md+` breakpoints.

**Rationale:**

- Cards avoid horizontal scroll on mobile entirely — critical given ₱ currency strings and date ranges
- Tables give the data density needed for comparison on desktop
- The responsive switch at `lg` (1024px) means the table only renders where there's enough room
- Avoids "responsive table" anti-patterns (hidden columns with horizontal scroll, collapsed rows)

**Tradeoff accepted:** Below `lg`, users see cards only. This is intentional — the table is not degraded, it's replaced.

---

### DataTable Column Design

**Columns and visibility by breakpoint:**

| Column                | `md+` (768px+) | Pinned | Sortable    |
| --------------------- | -------------- | ------ | ----------- |
| Deposit (bank + name) | ✓              | Left   | No          |
| Principal             | ✓              | No     | ✓           |
| Rate                  | ✓              | No     | ✓           |
| Maturity Date         | ✓              | No     | ✓           |
| Days to Maturity      | ✓              | No     | ✓ (default) |
| Net Interest          | ✓              | No     | ✓           |
| Payout Frequency      | ✓              | No     | No          |
| Status                | ✓              | No     | ✓           |
| Actions               | ✓              | No     | No          |

**Default sort:** Days to Maturity ASC — surfaces the most urgent deposits first.

**Overflow safety net:** Table container is still wrapped in `overflow-x-auto` regardless of viewport, protecting against browser zoom and edge cases. Deposit column is pinned left so identity is always visible.

---

### Default Row Sort Order

Sorted by urgency, not alphabetically or by creation date:

1. Matured — sorted by maturityDate ASC (most overdue first; needs action)
2. Active — sorted by maturityDate ASC (soonest maturity first)
3. Open-ended active — after term-based active (no deadline, lower urgency)
4. Settled — sorted by maturityDate DESC (most recent first)

---

### Filter Bar

The toolbar above the list/table contains two controls:

```
[All Banks ▼]   Show settled  ○──
```

- **Bank filter:** `Select` or `DropdownMenu` — filters to a single bank or all
- **Show settled Switch:** `Switch` component — toggles visibility of settled deposits
  - Default: off (settled hidden — they are the least actionable, hiding reduces noise)
  - On: settled rows/cards appear, visually de-emphasized (reduced opacity)
  - Binary state; no confirmation needed — it's a view preference, not a data mutation

---

### Action Group: Split Button

**Decision:** Each deposit row/card has a split button group — a primary `Button` for Settle and a `DropdownMenuTrigger` for secondary actions, visually joined. Consistent across all viewports (mobile card and desktop table).

```
[  Settle  |⋮]
```

**State variants by deposit status:**

| Status    | Left button                                  | Kebab items  |
| --------- | -------------------------------------------- | ------------ |
| `active`  | Settle — disabled (not yet matured)          | Edit, Delete |
| `matured` | Settle — enabled, warning variant            | Edit, Delete |
| `settled` | Hidden (replaced with muted "Settled" label) | Edit, Delete |

**Settle confirmation behavior:**

- Clicking Settle → opens `AlertDialog` to confirm (one-way financial action; accidental taps are plausible on mobile)
- Rationale: Settling is semantically significant even in a local app; the dialog prevents a class of accidental state changes

**Dialog content:** Shows deposit name, principal, net interest, and total proceeds (`principal + netInterest`). Confirm button label includes the amount: "Settle ₱20,358.90" — reduces accidental confirmation.

**Kebab items:** Edit, Delete (with destructive styling on Delete).

**Accessibility:** Settle button has `aria-label="Settle [deposit name]"`. Kebab has `aria-label="More options for [deposit name]"`. Neither uses generic labels since multiple action groups exist on the page simultaneously.

**Delete confirmation behavior:**

- Clicking Delete → opens destructive `AlertDialog` to confirm

---

### Collapsible Cards

**Decision:** Mobile cards are collapsible using shadcn `Collapsible` composed inside `Card`.

**Rationale:**

- Shows the critical snapshot (identity + urgency + actions) without scrolling through full details
- Full details (rate, exact maturity date, net interest, payout frequency) are available on expand
- Reduces visual density on mobile where screen space is limited
- Follows the "act or skip" mental model: collapsed = enough to decide; expanded = enough to understand

**Component composition:**

```
Card > Collapsible > [CardHeader > CollapsibleTrigger] + CollapsibleContent + CardFooter
```

**Always visible (collapsed):**

- Status badge + deposit name(in CollapsibleTrigger)
- Maturity date + `[Settle | ⋮]` split button group (in CardFooter, always reachable)

**Visible only when expanded (CollapsibleContent):**

- Bank name
- Principal
- Net Interest
- Rate
- Payout Frequency

**Trigger:** Entire `CardHeader` row is the collapse trigger. Chevron icon rotates on state change. `CollapsibleTrigger` renders as `<button>` — not overridden with `asChild` on a non-button element.

---

### Collapsed Card Snapshot

The snapshot answers three questions without expanding:

1. **What is this?** — Deposit name + status badge
2. **What state is it in?** — Status badge (Active / Matured / Settled)
3. **Should I act on it?** — Days to Maturity

This is the minimum viable context for a user to decide whether to expand or move on.

---

### Empty State

When no deposits exist:

- Centered illustration/icon
- "No investments tracked yet" heading
- Short explanation line
- Primary CTA: "+ Add Investment"

Same CTA as the header button — reinforces the action path for first-time users.

---

### Accessibility Decisions

#### List Semantics

- Container: `<ul role="list" aria-label="Investment deposits">`
- Each item: `<li>` wrapping `<Card>`
- `role="list"` preserves list semantics in Safari (stripped by `list-style: none`)

#### Card Identity

- Each card: `<article aria-labelledby="deposit-{id}-name">`
- Heading: `<h3 id="deposit-{id}-name">` — gives screen readers a meaningful label per card

#### Collapsible Trigger

- `CollapsibleTrigger` renders as `<button>` (Radix default) — not overridden
- `aria-expanded` managed automatically by shadcn/Radix
- Chevron: `aria-hidden="true"` (decorative)

#### Progress Bar (if ever reintroduced)

- `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="X% of term elapsed"`

#### Action Labels

- Settle button: `aria-label="Settle [deposit name]"` — never just "Settle"
- Kebab: `aria-label="More options for [deposit name]"` — never just "More options"
- DropdownMenu items: `role="menuitem"` (managed by shadcn)

#### Keyboard Navigation (per collapsed card)

1. `Tab` → CollapsibleTrigger — `Enter`/`Space` toggles expand
2. `Tab` → Settle button — `Enter` opens confirm dialog
3. `Tab` → Kebab button — `Enter`/`Space` opens menu; `Escape` closes

3 tab stops per collapsed card. Expanded adds tab stops within CollapsibleContent.

#### Live Region for Settle

- `<div role="status" aria-live="polite" className="sr-only">` announces settlement
- `role="status"` = polite live region (waits for reader to finish current announcement)
- Example output: "OwnBank 30D marked as settled."

#### Reduced Motion

- Collapsible expand/collapse animation respects `prefers-reduced-motion`
- Verify Radix UI animation CSS uses `@media (prefers-reduced-motion: no-preference)` guard

---
