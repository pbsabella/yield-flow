# YieldFlow — Decisions Log

> Why the product is the way it is. Read this when weighing tradeoffs, writing prompts, or touching a feature with a contested history.
> This is a **pruned** archive: entries that were superseded by later decisions were dropped, not kept as stale history.
> For current-state behavior read PRODUCT.md; for build conventions read ENGINEERING.md.

---

## Data Layer

### No Backend

All data lives in `localStorage`. No accounts, no sync, no servers. The tradeoff — data is local only — is surfaced explicitly to users rather than hidden. Makes the app zero-friction to deploy and use while being honest about its constraints.

### Three Explicit Modes

**Empty → Demo → Real** are distinct states, not blended.

- **Empty**: Entry gate (`EmptyLanding`) when no stored data exists. Two primary CTAs: "Add my first investment" / "Explore with demo data". A tertiary link handles restore-from-file without hiding it in settings.
- **Demo**: Demo deposits are purely in-memory — never written to `yf:deposits`. Persistent banner makes this unambiguous. The full nav and Settings remain available; Settings shows "Exit Demo" and disables export/import instead.
- **Real**: Standard mode. `localStorage` persistence. Settings accessible via nav.

**Rejected:** auto-seeding demo data when no stored deposits exist. It conflated exploration with data entry — the first user action in demo mode silently wrote demo deposits to storage.

### Settings as a Separate Route

Data management lives at `/settings`, not on the main dashboard. Keeps the primary view focused on portfolio data. Settings navigates back to `/` after import or clear so the user always lands in the correct state.

### Caveats Are Opt-In

Storage limitations are surfaced in a collapsible section in Settings ("What you should know about local storage"), not as a persistent banner. Banners train users to ignore them immediately. The caveats are visible when relevant (before clearing, before exporting) and collapsed otherwise.

---

## Dashboard

Landing page. With no deposits it shows the `EmptyLanding` gate (add first / demo / import backup); with data it renders KPI cards, this-month payouts, and bank exposure. The KPI cards:

### Three KPIs

**Total Principal · Income This Month · Next Maturity** answer the three questions a yield-ladder user asks on every visit: how much is deployed, what's coming in right now, what do I need to act on next. Every other stat belongs in the Investments page, not the summary view.

**Total Principal excludes settled** — settled deposits already paid out; including them overstates the active portfolio. Subtext ("Excludes settled.") makes the definition explicit.

**Net only in KPI cards** — no gross figures. After-tax net is what users plan with; gross requires mental math on every glance.

### Income This Month: Pending / Settled Pills

Single net total with optional pills breaking it into pending and settled portions. Pills appear only when both values are non-zero — no visual noise when the month is all-pending or all-settled. The total is what users plan with; the breakdown is a secondary signal.

### This Month Preview

A compact preview card below the KPIs shows up to 3 current-month cash-flow entries with a "+N more" indicator and a "View all" link. Surfaces the most immediately relevant cash flow without forcing a navigation.

### Bank Exposure Card

Per-bank total active principal as a progress bar against an optional deposit insurance limit (set in Settings). Green ≤ 80% of limit, amber > 80%, red > 100%. Surfaces concentration risk at a glance — users stacking deposits in one bank may not realise they exceed insurance limits.

**Tradeoff accepted:** the limit is a user-entered preference, not validated against any regulatory source. The card is a prompt, not a guarantee.

---

## Investments Page

### Cards on Mobile, DataTable on Desktop

`DepositCard` components below `md` (768px), TanStack Table at `md+`.

**Rationale:** cards avoid horizontal scroll on mobile entirely (critical given ₱ currency strings and date ranges); tables give the density needed for comparison on desktop; avoids "responsive table" anti-patterns (hidden columns + horizontal scroll, collapsed rows).

**Tradeoff accepted:** below `md` users see cards only. The table is not degraded, it's replaced.

### Mobile Card Sort Order

Groups render in urgency order with section headers: **Matured** (overdue first) → **Active** (soonest maturity first) → **Open-ended** (no deadline, lower urgency) → **Settled** (most recent first, hidden unless "Show inactive" is on).

### Collapsible Cards

Mobile cards are collapsible: `Card > Collapsible > [CardHeader > CollapsibleTrigger] + CollapsibleContent + CardFooter`.

- **Always visible (collapsed):** status badge + deposit name + maturity label + action buttons.
- **Visible when expanded:** bank · principal · net interest · rate (shows "Tiered") · term (omitted for open-ended) · payout frequency.

### Maturity Decision Dialog, Not a Confirmation

The Settle button opens a decision dialog showing proceeds (Principal | Net interest | Total proceeds) with mutually-exclusive options — Withdraw / Renew everything / Renew principal only — and Continue disabled until a choice is made. An explicit decision, not a confirmation, since the outcomes differ. Prevents accidental settlement or renewal of a one-way financial action. TD Monthly deposits collapse to Withdraw / Renew (interest already paid monthly, so both renew variants are identical).

### Delete Confirmation

Destructive `AlertDialog`. No undo.

---

## Cash Flow Page

### Dual-Mode Layout: Area Chart + Collapsible Month Rows

A smooth SVG area chart (macro shape) and a list of collapsible month rows (detail) are always visible together, not toggled. Separating them would force users to cross-reference from memory.

### 12-Month Default Window

`3M / 6M / 12M / All` toggle, default 12M — useful annual context without the long tail. "All" shows every month with projected income; months with no payouts are omitted.

### Projection Excludes Settled

Settled deposits already paid out — including them would misrepresent future income. **Exception:** the current month row shows the complete picture (active, matured, settled) because current-month income is already partially realised.

### Open-Ended: 12-Payout Projection Anchored to startDate

Open-ended deposits project as 12 monthly payouts anchored to the deposit's `startDate`, not today; the first projected month is the earliest payout month ≥ the current calendar month. Preserves the actual payout rhythm — a savings account opened on Jan 20 pays on the 20th each month, not today + 1 month.

### Current Month Row Open by Default

The current month is the most relevant period for almost every session; auto-expanding saves a tap for the most common interaction. All other rows start collapsed.

### Grouping by Payout Type

Within each expanded month, entries group under "At maturity payouts" and "Monthly payouts" sub-headers (only when non-empty). At-maturity payouts are often 10–20× larger than monthly ones; a flat list distorts the monthly total.

### Principal Returned Line

When a maturity payout entry has `principalReturned > 0`, a secondary line shows "+₱X principal returned" below the net interest — surfaces the full cash event without confusing it with income.

### Amounts Are Always Net

Every number (chart, month totals, entries) is net of withholding tax, with one disclaimer line above the chart.

---

## Add / Edit Wizard

### Single-Step Dialog

A single centered `Dialog` with the form on the left and a live calc panel on the right (desktop) or compact strip below (mobile). No steps, no templates.

**Rejected:** the original 2-step wizard and bank product templates. Templates go stale immediately when banks change rates; the step split only made sense when templates drove pre-fill — with free-text input, Step 1 became a single field with no reason to be its own screen.

### No Outside-Click Close

`onInteractOutside` is prevented — accidental dismissal would lose the user's inputs. ESC (or the X) triggers a discard-confirm `AlertDialog` when the form is dirty; closes cleanly when not.

### Free-Text Bank Name

Plain text input with a `<datalist>` populated from existing deposit `bankId` values. No curated registry — a curated list requires ongoing maintenance with no server to pull updates from.

### Product Type as Radio Cards

Three product cards (Time Deposit · TD Monthly Payout · Savings) replace the old template selector. Card selection makes the modes visually distinct and scannable; a dropdown would hide them.

### Tiered Rates Are Tiered-Only

Compounding (`[Daily][Monthly]`) is visible only when `interestMode = tiered`; simple-interest deposits hide it because the engine ignores compounding on the simple branch. Switching simple → tiered seeds tier rates from the current `flatRate`; tiered → simple restores `flatRate` from `tiers[0].rate`.

### Snapshot-Based Dirty Tracking

`isDirty = JSON.stringify(formState) !== JSON.stringify(initialState)`, with `initialState` set on open/load. Field-level empty checks would flag edit mode as dirty since all fields are populated; JSON comparison handles arrays (tiers) without per-field logic. Users can cancel out of an unmodified edit session without a discard prompt.

**Tradeoff accepted:** a `JSON.stringify` on every render for the `isDirty` memo — acceptable, the form state is a flat object with at most ~15 fields plus a small tiers array.

---

## Settings

### Appearance Lives in Settings

Theme toggle lives on the Settings page, not the nav — appearance is an infrequent, intentional action, and the primary nav stays clean.

### No Direct State Mutation

Settings never writes to `localStorage` directly. All mutations go through `PortfolioContext` (`importDeposits`, `clearDeposits`, `setPreference`) — keeps the data layer isolated and testable.

### Import Replaces, Never Merges

Import shows a "Replace all data?" confirm dialog with old/new counts, then replaces deposits (+ preferences + theme). Restore semantics, and avoids duplicate-detection complexity. JSON envelope (`{ version, exportedAt, ... }`) was chosen over CSV because it round-trips without data loss.
