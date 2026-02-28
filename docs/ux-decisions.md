# YieldFlow — UX Decisions Log

A running record of design and UX decisions made during development.

---

## Phase 1: Data Layer

### No Backend

All data lives in `localStorage`. No accounts, no sync, no servers. The tradeoff — data is local only — is surfaced explicitly to users rather than hidden. This makes the app zero-friction to deploy and use, while being honest about its constraints.

---

### Three Explicit Modes

**Empty → Demo → Real** are distinct states, not blended.

- **Empty**: Entry gate (`EmptyLanding`) shown when no stored data exists. Two primary CTAs: "Add my first investment" or "Explore with demo data". A tertiary link ("Switching devices? Import a backup") handles the restore-from-file case without hiding it in settings.
- **Demo**: Purely in-memory. No writes to `localStorage` at any point. A persistent banner makes this unambiguous. The settings nav is hidden in demo mode to prevent navigating away and losing in-memory state.
- **Real**: Standard mode. `localStorage` persistence. Settings accessible via nav.

**Decision rejected:** Auto-seeding demo data when no stored deposits exist. It conflated exploration with data entry — the first user action in demo mode silently wrote demo deposits to storage.

---

### Settings as a Separate Route

Data management lives at `/settings`, not on the main dashboard. Keeps the primary view focused on portfolio data. Settings navigates back to `/` after import or clear so the user always lands in the correct state.

---

### Export / Import Format

JSON with `{ version, exportedAt, deposits }` envelope. Chosen over CSV because it can round-trip through import without data loss. The version field is a forward-compatibility hook. Import shows a confirmation dialog with the count of depositis being replaced, then replaces all data — consistent with restore semantics and avoids duplicate detection complexity.

---

### Caveats Are Opt-In

Storage limitations are surfaced in a collapsible section in Settings ("What you should know about local storage"), not as a persistent banner on every page load. The banner approach trains users to ignore it immediately. The caveats are available when relevant and out of the way otherwise.

---

## Phase 2: Dashboard Page

### Three KPIs: Total Principal, Income This Month, Next Maturity

These answer the three questions a yield-ladder user asks on every visit:

1. **How much is deployed?** → Total Principal
2. **What's coming in right now?** → Income This Month
3. **What do I need to act on next?** → Next Maturity

Every other stat belongs in the Investments page, not the summary view.

---

### Total Principal Excludes Settled

Settled deposits have already paid out — including them would overstate the active portfolio size. The subtext ("Excludes settled.") makes the definition explicit.

---

### Income This Month: Pending / Settled Breakdown

The card shows a single net total with optional pills breaking it into pending and settled portions. The pills only appear when both values are non-zero — no visual noise when the month is all-pending or all-settled.

**Decision:** Show both pending and settled in the same card rather than splitting into two KPIs. The total is what users plan with; the breakdown is a secondary signal.

---

### Next Maturity: Date + Name + Net Proceeds

Shows the maturity date large, with deposit name and "bank · net proceeds" below. Enough to decide whether to act without navigating to Investments. Shows "—" when no active or matured deposits exist.

---

### Net Only in KPI Cards

No gross figures in any KPI card. After-tax net is what users plan with. Gross requires mental math on every glance.

---

### This Month Preview

Below the KPI cards, a compact preview card shows up to 3 of the current month's cash flow entries (name + bank + net amount) with a "View all →" link to `/cashflow`. If there are more than 3, a "+N more" indicator appears. Shows "No payouts scheduled this month." when empty.

**Decision:** Surface a preview of the most immediately relevant cash flow data without making the user navigate to a separate page. Three entries is enough to prompt action or confirm there's nothing urgent.

---

### Bank Exposure Card

Below the month preview, a card shows each bank's total active principal as a progress bar against an optional deposit insurance limit (set in Settings). Bar colors: green (< 80% of limit), amber (80–100%), red (> 100%). Hidden when no active deposits exist, or when the limit is unset (shows amounts only with no bar).

**Decision:** Surface concentration risk at a glance. Users stacking multiple deposits in a single bank may not realise they exceed PDIC limits. A progress bar communicates this without requiring users to do math.

**Tradeoff accepted:** The limit is a user-entered preference — not validated against any regulatory source. The card is a prompt, not a guarantee.

---

## Phase 3: Investments Page

### Overview

The Investments page is the primary data view — a scannable list of all deposits with status, key financials, and actions. It must work well on mobile (primary use case) and provide data density on desktop.

---

### Layout Strategy: Cards on Mobile, DataTable on Desktop

**Decision:** Render `DepositCard` components below `md` breakpoint (768px) and switch to a TanStack Table at `md+`.

**Rationale:**

- Cards avoid horizontal scroll on mobile entirely — critical given ₱ currency strings and date ranges
- Tables give the data density needed for comparison on desktop
- Avoids "responsive table" anti-patterns (hidden columns with horizontal scroll, collapsed rows)

**Tradeoff accepted:** Below `md`, users see cards only. This is intentional — the table is not degraded, it's replaced.

---

### DataTable Column Design

| Column           | Pinned | Sortable        |
| ---------------- | ------ | --------------- |
| Deposit (bank + name) | Left (frozen) | No |
| Principal        | No     | ✓               |
| Rate             | No     | ✓               |
| Maturity Date    | No     | ✓               |
| Days to Maturity | No     | ✓ (default ASC) |
| Net Interest     | No     | ✓               |
| Payout           | No     | No              |
| Status           | No     | ✓               |
| Actions          | No     | No              |

**Default sort:** Days to Maturity ASC — surfaces the most urgent deposits first.

**Frozen column:** The Deposit column is frozen, so bank + name are always visible while scrolling horizontally.

**New deposit highlight:** When a deposit is added via the modal, the matching row/card receives a highlight that fades over 1s.

---

### Mobile Card Sort Order

Groups are rendered in urgency order with section headers:

1. **Matured** — sorted ASC by maturityDate (most overdue first; needs action)
2. **Active** — sorted ASC by maturityDate (soonest maturity first)
3. **Open-ended** — after term-based active (no deadline, lower urgency)
4. **Settled** — sorted DESC by maturityDate (most recent first); hidden unless "Show settled" is on

---

### Filter Bar

```
[All Banks ▼]   Show settled  ○──
```

- **Bank filter:** `Select` — filters to a single bank or all. Options are derived from the current portfolio (no hard-coded list).
- **Show settled Switch:** Default off (settled hidden). On: settled rows/cards appear. When all results are filtered out, a "No matching deposits" empty state appears with a "Clear filters" action.

---

### Collapsible Cards

**Decision:** Mobile cards are collapsible (`Collapsible` composed inside `Card`).

**Component composition:**
```
Card > Collapsible > [CardHeader > CollapsibleTrigger] + CollapsibleContent + CardFooter
```

**Always visible (collapsed):** Status badge + deposit name (in CollapsibleTrigger) + maturity label + action buttons (in CardFooter)

**Visible only when expanded:** Bank · Principal · Net interest · Rate (shows "Tiered" for tiered-rate deposits) · Term (omitted for open-ended) · Payout frequency

**Maturity label (MaturityLabel sub-component):**
- > 30 days away: "Matures [date]"
- 1–30 days: "Due in Nd" (amber)
- Today: "Due today" (amber)
- Past maturity: "Nd overdue" (amber)
- Open-ended: "Open-ended"
- Settled: "—"

---

### Action Group: Split Button

Each card footer has a joined button group — Settle button + kebab trigger visually connected.

```
[  Settle  |⋮]
```

| Status    | Settle button                  | Kebab items  |
| --------- | ------------------------------ | ------------ |
| `active`  | Not shown                      | Edit, Delete |
| `matured` | Shown, triggers confirm dialog | Edit, Delete |
| `settled` | Not shown                      | Edit, Delete |

**Settle confirmation dialog:** Shows deposit name, net interest, and total proceeds. Confirm requires a second click — prevents accidental settlement of a one-way financial action.

**Delete confirmation dialog:** Destructive `AlertDialog`. No undo.

**Accessibility:** Settle button `aria-label="Settle [deposit name]"`. Kebab `aria-label="More options for [deposit name]"`.

---

### Empty States

- **No deposits:** Icon + "No investments tracked yet" + "Add investment" CTA (disabled, since the wizard is triggered from the nav).
- **No results (filters active):** Icon + "No matching deposits" + "Clear filters" CTA that resets the bank filter.

---

### Accessibility

- `<ul role="list">` preserves list semantics in Safari (stripped by `list-style: none`)
- Each card: `<article aria-labelledby="deposit-{id}-name">`
- `aria-expanded` managed automatically by Radix Collapsible
- `<div role="status" aria-live="polite" className="sr-only">` announces "{{name}} marked as settled." after settling

---

## Phase 4: Cash Flow Page

### Overview

The Cash Flow page answers: _when will money arrive, and how much?_ Where Investments is about individual deposits, Cash Flow is about the aggregate income stream — month by month, looking forward.

---

### Dual-Mode Layout: Area Chart + Collapsible Month Rows

**Decision:** The page combines a smooth SVG area chart (macro view) with a list of collapsible month rows (detail view). They are always visible together, not toggled.

**Rationale:**

- The chart gives immediate shape — which months are heavy, sparse, where the peaks are
- The row list gives the _why_ — which specific deposits contribute, and for how much
- Separating them would force users to cross-reference from memory

**Chart details:**
- SVG area chart with a cubic bezier smooth curve
- Filled gradient area below the line (primary color, 35% → 0% opacity)
- Current month: filled dot marker
- Peak month: value label above the point
- X-axis: month abbreviations; current month bold

---

### Window Filter: 3M / 6M / 12M / All

A compact `ToggleGroup` (card variant) lets users narrow the chart and row list to 3, 6, or 12 future months, or show all projected months.

**Default:** 12 months. Provides useful annual context without the long tail.

**Behaviour:** "All" shows every month with any projected income, regardless of how far out. Months with no payouts are omitted — they do not appear as empty rows.

---

### Projection Excludes Settled Deposits

Settled deposits have already paid out — their cash has been received. Including them would misrepresent future income.

**Exception:** The current month row shows the complete picture — active, matured, and settled entries — because income for the current month is already partially realised.

---

### Open-Ended Deposits: 12-Payout Projection

Open-ended (savings) deposits are projected as 12 monthly payouts, anchored to the deposit's `startDate` — not to today. The first projected month is the earliest payout month ≥ the current calendar month.

**Rationale:** Anchoring to `startDate` preserves the actual payout rhythm. A savings account opened on Jan 20 pays on the 20th of each month — the projection uses Feb 20, Mar 20, etc., not today + 1 month.

---

### Current Month Row Is Open by Default

The current month row initialises in the expanded state. All other rows initialise collapsed.

**Rationale:** The current month is the most immediately relevant period for almost every user session. Auto-expanding saves a tap for the most common interaction.

---

### Grouping Entries by Payout Type

Within each expanded month, entries are grouped under "At maturity payouts" and "Monthly payouts" sub-headers. Groups are shown only when non-empty.

**Rationale:** At-maturity payouts are lump sums often 10–20× larger than monthly payouts; mixing them in a flat list distorts the reading of the monthly total.

---

### Status Badges in Entry List

Within the **current month** entry list only:

- `matured` entries → "Due now" alert badge (action needed)
- `settled` entries → "Settled" success badge (muted signal)
- `active` entries → no badge (self-evidently pending)

**Decision:** "Pending" label was removed from active entries. An active deposit in the current month's list is self-evidently pending — the label stated the obvious.

---

### Principal Returned Line

When a maturity payout entry has `principalReturned > 0`, a secondary line appears below the net interest amount: "+₱X principal returned". This surfaces the full cash event without confusing it with income.

---

### Amounts Are Always Net

Every number in the Cash Flow page — chart, month totals, entry amounts — is net of withholding tax. A single disclaimer line ("All amounts are net of withholding tax") appears once above the chart via an `<Info>` icon.

---

### Empty State

When there are no future months with projected income, a centred empty state appears: "No upcoming cash flow" + "Add active deposits in the Investments tab to see your 12-month income projection."

---

## Phase 5: Add / Edit Investment Modal

### Single-Step Dialog

A single centered `Dialog` with the form on the left (scrollable) and a live calc panel on the right (desktop) or compact strip below (mobile). No steps, no templates, no multi-screen wizard.

**Decision:** Collapsed the original 2-step wizard into a single form. Bank product templates were removed entirely.

**Rationale:**

- Templates go stale immediately when banks change rates
- The step split only made sense when templates drove pre-fill; with free-text input, Step 1 became a single field with no reason to be a separate screen
- A single form with clear field groups is faster to complete and easier to orient in

---

### Dialog Behaviour

- **No outside-click close:** `onInteractOutside` is prevented. Accidental dismissal would lose the user's inputs.
- **ESC → discard confirm (if dirty):** If `isDirty`, ESC opens an `AlertDialog`: "Discard changes?" / "Discard this investment?" with Keep editing / Discard options. If not dirty, ESC closes cleanly.
- **Close button (X):** Same `requestClose()` path as ESC — triggers discard confirm if dirty.
- **Title changes by mode:** "Add investment" / "Edit investment"
- **Submit button label:** "Add investment" / "Save changes". Disabled until `canSubmit`.

---

### Form Fields (in order)

1. **Bank** — free-text `<input list>` with `<datalist>` populated from existing deposit bank names. Required.
2. **Product type** — radio cards (not a Select): Time Deposit · TD Monthly Payout · Savings. Required. Sets `payoutFrequency` and `isOpenEnded` as side-effects.
3. **Name** — optional label. Placeholder auto-fills with "{bankName} deposit" when bank is entered.
4. **Principal** — ₱ prefix, currency-masked input. Required.
5. **Start date** — `DatePicker`. Uses `toISODate()` (local timezone safe).
6. **Interest rate** — flat `%` input **or** tiered `TierBuilder` (toggled by "Tiered rates" switch in the label row). Required. Soft warning outside 0.01–25%.
7. **Withholding tax** — default 20%, editable. Labeled generically (no geographic mention).
8. **Day count** — `[365][360]` toggle (card variant). Default 365.
9. **Compounding** — `[Daily][Monthly]` toggle. Always shown.
10. **Term** — numeric input + `[Months][Days]` unit toggle. Shown for fixed-term products (TD, TD Monthly) and non-open-ended Savings. Mutually exclusive: switching unit clears the other field.
11. **Payout frequency** — `[Monthly][At maturity]` toggle. Fixed-term products only.
12. **Open-ended switch** — Savings product only. When on: hides Term field.

---

### Tiered Rate Builder

The `TierBuilder` component renders a grid of tier rows: [Balance up to] · [Annual rate %] · [Remove button].

- Last tier's "balance up to" column is replaced with a disabled "and above" chip.
- "+ Add tier" inserts a new row above the last (inheriting the last tier's rate as a default).
- Tiers with a single row disable the remove button.

---

### Free-Text Bank Name

Bank is a plain text input with a `<datalist>` populated from existing deposit `bankId` values. No curated registry.

**Rationale:** A curated bank list requires ongoing maintenance with no server to pull updates from. Datalist gives autocomplete for repeat entries without a registry.

---

### Product Type as Radio Cards

Three product cards replace the old template selector. Card selection makes the three modes visually distinct and scannable; a dropdown would hide the options.

---

### Snapshot-Based Dirty Tracking for Edit Mode

`isDirty = JSON.stringify(formState) !== JSON.stringify(initialState)`. On open, `initialState` is set to either `EMPTY_STATE` (add) or the loaded deposit's form state (edit). Edit mode opens with `isDirty = false`.

**Rationale:** Field-level empty checks would immediately flag edit mode as dirty since all fields are populated. JSON snapshot comparison handles arrays (tiers) correctly without per-field logic. Users can cancel out of an unmodified edit session without a discard prompt.

**Tradeoff accepted:** A JSON stringify on every render for the `isDirty` memo. Acceptable — form state is a flat object with at most ~15 fields plus a small tiers array.

---

## Phase 6: Settings Page

### Overview

Settings is the data management and personalisation hub. It is fully self-contained — actions navigate back to `/` on completion rather than mutating state in-place. Organised into four cards: Appearance, Preferences, Data management, and an About footer.

---

### Appearance Card

Theme toggle (light/dark) lives here, not in the nav. Keeps the primary nav clean; appearance is an infrequent, intentional action.

---

### Preferences Card

**Currency selector:** Changes the currency symbol used across all formatted amounts (₱, $, €, etc.). Does not convert numbers — display only. Saved to `localStorage` via `setPreference`.

**Deposit insurance limit:** Optional numeric input. When set, the Bank Exposure card on the Dashboard renders progress bars against this limit. A "Clear" inline button resets it. Preferences are saved explicitly via a "Save changes" button, which shows a `sonner` toast on success.

---

### Data Management Card

| Action | Trigger | Behaviour |
| --- | --- | --- |
| **Export JSON** | Button click | Downloads `yieldflow-export-{date}.json`. Disabled when no deposits. |
| **Import JSON** | Button click → file picker | Validates schema (version = 1, required fields per deposit). Valid: shows "Replace all data?" confirm dialog with old/new counts. Confirm: replaces deposits, navigates to `/`. Invalid: shows inline error below the button; stays on `/settings`. File input value is reset after each pick so the same file can be re-selected. |
| **Clear all** | Button click | Destructive confirm: "Clear all data?" → "Clear all data" (destructive). Confirm: clears deposits, navigates to `/`. Disabled when no deposits. |

---

### Caveats Section

A collapsible section within the Data management card: "What you should know about local storage". Surfaces five limitations: unencrypted storage, no cross-device sync, browser-history clearing erases data, sensitive data in exports, not recommended on shared computers.

**Decision:** Opt-in collapsible, not a banner. The banner approach trains users to ignore it; the caveats are visible when relevant (before clearing, before exporting) and collapsed otherwise.

---

### No Direct State Mutation

Settings never writes to `localStorage` directly. All mutations go through `PortfolioContext` (`importDeposits`, `clearDeposits`, `setPreference`). This keeps the data layer isolated and testable.
