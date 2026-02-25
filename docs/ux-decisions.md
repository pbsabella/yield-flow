# YieldFlow — UX Decisions Log

A running record of design and UX decisions made during development.
Intended as a reference during implementation and source material for a future case study.

---

## Phase 1: Data Layer

### No Backend

All data lives in `localStorage`. No accounts, no sync, no servers. The tradeoff — data is local only — is surfaced explicitly to users rather than hidden. This makes the app zero-friction to deploy and use for a portfolio project, while being honest about its constraints.

---

### Three Explicit Modes

**Empty → Demo → Real** are distinct states, not blended.

- **Empty**: Entry gate (`EmptyLanding`) shown when no stored data exists. Two primary paths: add real data or explore with demo. A third link ("Switching devices? Import a backup") handles the restore-from-file case without hiding it in settings.
- **Demo**: Purely in-memory. No writes to `localStorage` at any point — not even on the first user action. A persistent banner makes this unambiguous. The settings nav is hidden in demo mode to prevent navigating away and losing the in-memory state.
- **Real**: Standard mode. localStorage persistence. Settings accessible via gear icon.

**Decision rejected:** Auto-seeding demo data when no stored deposits exist (the previous dev-only behavior). It conflated exploration with data entry — the first user action in demo mode silently wrote demo deposits to storage.

---

### Settings as a Separate Route

Data management (export, import, clear, caveats) lives at `/settings`, not on the main dashboard. Keeps the primary view focused on portfolio data. The settings page handles its own confirmation dialogs and navigates back to `/` after import or clear — so the user always lands in the correct state without manual navigation.

---

### Export / Import Format

JSON with `{ version, exportedAt, deposits }` envelope. Chosen over CSV because it can round-trip through import without data loss. The version field is a forward-compatibility hook. Import replaces all data (not merge) — consistent with restore semantics and avoids duplicate detection complexity.

---

### Caveats Are Opt-In

Storage limitations are surfaced in a collapsible section in Settings, not as a persistent banner on every page load. The banner approach was tried first — it trained users to ignore it immediately. The caveats are available when relevant (before clearing, before exporting) and out of the way otherwise.

---

## Phase 2: Dashboard and KPI Cards

### Three KPIs: Total Principal, Income This Month, Next Maturity

These answer the three questions a yield-ladder user asks on every visit:

1. **How much is deployed?** → Total Principal
2. **What's coming in right now?** → Income This Month
3. **What do I need to act on next?** → Next Maturity

Every other stat (individual rates, term lengths, net interest per deposit) belongs in the Investments tab, not the summary view.

---

### Total Principal Excludes Settled

Settled deposits have already paid out — including them would overstate the active portfolio size. The subtext ("Excludes settled.") makes the definition explicit without requiring a tooltip.

---

### Income This Month: Pending / Settled Breakdown

The card shows a single net total with optional pills breaking it into pending and settled portions. The pills only appear when both values are non-zero — no visual noise when the month is all-pending or all-settled.

**Decision:** Show both pending and settled in the same card rather than splitting into two KPIs. The total is what users plan with; the breakdown is a secondary signal (how much is already confirmed vs. still waiting on a maturity action).

---

### Next Maturity: Name + Bank + Net Proceeds

Shows enough to decide whether to act (name and bank for identity, net proceeds for the payout amount) without navigating to the Investments tab. The field is blank (`—`) when no active or matured deposits exist.

---

### Net Only in KPI Cards

No gross figures in any KPI card. After-tax net is what users plan with. Gross requires mental math on every glance; showing it would make the summary less useful, not more complete.

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

## Phase 4: Cash Flow Tab

### Overview

The Cash Flow tab answers a question the Investments tab doesn't: _when will money arrive, and how much?_ Where the Investments tab is about individual deposits, the Cash Flow tab is about the aggregate income stream — month by month, looking forward.

---

### Dual-Mode Layout: Chart + Collapsible Row List

**Decision:** The tab combines a horizontal bar chart (macro view) with a list of collapsible month rows (detail view). They are always visible together, not toggled.

**Rationale:**

- The chart gives immediate shape — which months are heavy, which are sparse, where the peaks are
- The row list gives the _why_ — which specific deposits contribute to a given month, and for how much
- Separating them into tabs would force users to cross-reference from memory
- Stacking them vertically lets the chart serve as navigation context while the rows serve as drill-down

**Tradeoff accepted:** More vertical space consumed. Acceptable because this is a dedicated tab, not a dashboard widget.

---

### Window Filter: 3M / 6M / 12M / All

**Decision:** A compact toggle lets users narrow the chart and row list to 3, 6, or 12 months ahead, or show all projected months.

**Rationale:**

- Most users care about the next 3–6 months for cash planning; 12 months for annual view
- Showing all months by default creates visual noise and chart distortion when far-future months dwarf near-term ones
- A toggle is faster than a date picker and matches the mental model ("how far ahead do I want to see?")

**Default:** 12 months. Provides useful annual context without showing the full long tail.

---

### Projection Excludes Settled Deposits

**Decision:** The 12-month chart and future month rows are built from active and matured deposits only. Settled deposits are excluded from the projection.

**Rationale:**

- Settled deposits have already paid out — their cash has been received and is no longer "incoming"
- Including them would misrepresent future income as higher than it actually is
- Users should see what is still owed to them, not a historical record

**Exception:** The current month row includes settled entries in its entry list (see below). The projected total for future months stays clean.

---

### Current Month: Full Picture vs. Projection

**Decision:** The current month row shows the complete income picture — active, matured, and settled entries — with a header total that includes confirmed settled amounts. Future month rows show projection only (active + matured).

**Rationale:**

- For the current month, income is already partially realized. Hiding settled amounts would undercount the month's true earnings.
- The "Income This Month" KPI card already shows the full net including settled. The Cash Flow row should agree with it — inconsistency between the two would erode trust.
- Future months have no settled entries by definition, so the distinction only matters for the present.

**Tradeoff accepted:** The current month row can show more entries than future rows, which feels slightly asymmetric. The value of accuracy outweighs the visual inconsistency.

---

### Grouping Entries by Payout Type

**Decision:** Within each expanded month, entries are grouped under "At maturity payouts" and "Monthly payouts" sub-headers. Groups are shown only when non-empty.

**Rationale:**

- At-maturity payouts are lump sums often 10–20× larger than monthly payouts from the same deposit; mixing them in a flat list distorts the reading of the monthly total
- Users asking "will this be enough for monthly expenses?" care about recurring income separately from lump-sum windfalls
- Grouping surfaces the structural difference without requiring users to remember which deposits pay how

---

### Status in Entry List: Matured vs. Settled

**Decision:** Within the current month entry list, matured entries get a "Due now" warning badge. Settled entries appear muted with "(settled)" appended. Active entries get no badge.

**Rationale:**

- "Due now" signals action needed — the deposit has matured but hasn't been settled. It earns a badge because it has an implication beyond just "this money is coming."
- "Pending" (previous label for active entries) was removed because it added noise without adding meaning. An active deposit appearing in this month's list is self-evidently pending — the label stated the obvious.
- Settled entries are already done; they belong in the list for completeness (showing what the month's total is made of) but shouldn't compete visually with actionable items.

---

### Current Month Row Is Open by Default

**Decision:** The current month row initializes in the expanded state. All other rows initialize collapsed.

**Rationale:**

- The current month is the most immediately relevant period for almost every user session
- Auto-expanding it saves a tap/click for the most common interaction
- The collapsed state for all other months keeps the initial view clean while still allowing quick drill-down

---

### Amounts Are Always Net

**Decision:** Every number in the Cash Flow tab — chart bars, month totals, entry amounts — is net of 20% withholding tax. A single disclaimer line appears once above the chart.

**Rationale:**

- Users plan with take-home amounts, not gross figures. Gross income would require mental math on every number.
- A repeated per-row "net" label would add clutter with no new information after the first instance
- The disclaimer is visible before the chart rather than buried at the bottom, so users see it before reading any amounts

---

### Bar Chart: Current Month Uses Full Net (Including Settled)

**Decision:** The current month bar height and value label use the full net — active + matured + settled — matching the row header total. Future month bars use projection only (active + matured).

**Rationale:**

- The bar value and the row header showed different numbers for the same month, which eroded trust. A user glancing at the chart and then reading the row would see a discrepancy with no obvious explanation.
- Aligning the bar to the row header resolves the confusion without any added visual complexity.

**Alternatives considered:**

- *Stacked bar (primary for active/matured, grey for settled portion)* — communicates composition but the bars are 32px wide. The settled slice would often be a few pixels, too thin to read reliably and likely to feel like a rendering artifact rather than a deliberate signal.

**Tradeoff to revisit:** The current month bar is built from a different data source than future bars (realized + projected vs. pure projection). This means month-to-month bar heights are not strictly comparable — a settled deposit inflates the current month relative to what a future month would show for the same deposit mix. If users start to notice the inconsistency, the right fix is probably a stacked bar once bar widths are large enough to render two segments legibly, or a visual treatment that explicitly marks the current month as "actual vs. projected."

---

## Phase 5: Add / Edit Investment Wizard

### Single-Step Dialog (replacing 2-step wizard + templates)

**Decision:** Collapsed the original 2-step wizard into a single centered dialog with a live calc panel on the right (desktop) or compact strip below (mobile). Bank product templates were removed entirely.

**Rationale:**

- Templates go stale immediately when banks change rates — maintenance cost with no payoff
- The step split only made sense when templates drove Step 1 pre-fill; with free-text input, Step 1 became a single field with no reason to exist as a separate screen
- A single form with clear field groups is faster to complete and easier to orient in

**Tradeoff accepted:** Users must manually enter every value (no pre-fill). Accepted because rates change constantly — a pre-filled rate is misleading more often than it's helpful.

---

### Free-Text Bank Name

**Decision:** Bank is a plain text input with a `<datalist>` populated from existing deposit `bankId` values, rather than a searchable bank registry.

**Rationale:**

- A curated bank list requires ongoing maintenance; this app has no server to pull updates from
- Datalist gives autocomplete for repeat entries (same bank, multiple deposits) without a registry
- `bankId` is stored as-is; `usePortfolioData` synthesizes a `Bank` object when no match is found, so display is always correct regardless of how the name was entered

---

### Product Type as Radio Cards

**Decision:** Three product cards — TD (maturity), TD Monthly, Savings — replace the bank product template selector.

**Rationale:**

- Product type drives real form behavior (payout frequency, open-ended, term visibility) and is universally applicable across any bank
- Card selection makes the three modes visually distinct and scannable; a dropdown would hide the options

---

### Toggle Card Variant (ToggleGroup + Toggle)

**Decision:** All `ToggleGroup` components (day count, compounding, term presets, payout) use a `card` variant matching the radio card appearance: border + `border-primary` + `bg-primary/5` when selected.

**Rationale:**

- Consistent selection affordance across all segmented controls in the form
- Distinguishes clearly from disabled/unselected state without relying on color alone

---

### Snapshot-Based Dirty Tracking for Edit Mode

**Decision:** `isDirty = JSON.stringify(formState) !== JSON.stringify(initialState)`. On open, `initialState` is set to either `EMPTY_STATE` (add) or the loaded deposit's form state (edit). This means edit mode opens with `isDirty = false`.

**Rationale:**

- Field-level empty checks (the previous approach) would immediately flag edit mode as dirty since all fields are populated
- JSON snapshot comparison handles arrays (tiers) correctly without per-field logic
- Users can cancel out of an unmodified edit session without a discard prompt

**Tradeoff accepted:** A JSON stringify on every render for the `isDirty` memo. Acceptable — form state is a flat object with at most ~15 fields plus a small tiers array.

---
