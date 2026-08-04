# YieldFlow — Product Reference

> What to build and why. No engineering conventions here.
> For how to build it: read ENGINEERING.md.

---

## Non-negotiables

- **Net-only display.** Never show gross values in any primary view.
- **Explicit settle.** Never auto-settle investments; matured TDs may still earn via rollover.
- **Fix the label, not a tooltip.** Add tooltips only as a last resort — make the UI self-explanatory.
- **Wizard integrity.** No skipped steps, no outside-click close (ESC asks before discarding).

## Definition of Done

- Net interest matches manual calculation within ±1 in the display currency
- Overdue investments are always amber — never missed
- Wizard completable in under 2 minutes

---

## Investment Types

Product radios use these exact labels:

| Radio label     | `productType`  | Description                                  |
| --------------- | -------------- | -------------------------------------------- |
| Time Deposit    | `td-maturity`  | Fixed term, principal + interest at maturity |
| TD Monthly Payout | `td-monthly` | Interest paid monthly, principal locked      |
| Savings         | `savings`      | Open-ended, ongoing monthly interest (optional) |

---

## Domain Logic

| Concept       | Rule                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Display       | Net of tax only. Principal return is not income.                                                      |
| Status        | `active` → `matured` (derived at runtime from the maturity date — **never stored**) → `settled` (explicit). Or `active` → `closed` (explicit early closure). `settled` and `closed` are stored, terminal statuses. "Overdue" is presentation only, not a status. |
| Principal     | `active` + `matured` count. `settled` and `closed` excluded.                                          |
| Interest Mode | `simple` (flat rate) or `tiered` (brackets by principal balance)                                      |
| Term input    | Number input + `Months` / `Days` toggle (no presets). `termDays` takes precedence over months when set |
| Day-count     | `[365][360]` toggle (365 first, default); used for daily interest                                     |

---

## Portfolio (`/`)

The page is titled **Portfolio** (route `/`). The dashboard KPIs:

### KPI

**Total Principal** — active + matured only. Subtext: "Excludes settled."

**Income This Month** — net interest this month, including closed-deposit accrued interest. Shows pending + settled pills (hidden when zero; closed has no pill).

**Next Maturity** — next active investment. Shows date, name, bank, net proceeds.

### This month payouts

Title is the current month name ("August payouts"). Lists up to 3 upcoming current-month payout entries (deposit name or bank, bank, net amount). Overflow shows "+N more". Empty state: "No payouts scheduled this month." "View all" links to `/cashflow`.

### Exposure by Bank

Principal breakdown per bank with insurance coverage % when a limit is configured in Settings.

Skips **only settled** — closed deposits count. Color-coded: green ≤ 80%, amber > 80%, red > 100% of limit. (The Investments page's "Active summary" is active-only.)

The insurance limit is a single global preference applied per bank — not per-bank limits.

---

## Investments (`/investments`)

Controls: bank filter select, single **Show inactive** toggle (hides closed + settled; off by default), List / Ladder view toggle.

**Active summary strip** — collapsible (defaults closed). Shows principal + net interest per bank with insurance coverage %. Active-only (see "Exposure by Bank").

### List view

**Desktop table** — horizontally scrollable; Deposit column frozen (sticky left). Sorted by days-to-maturity ASC by default. All columns sortable **except** the row-index (#) and actions columns.

**Mobile cards** — grouped by status: Matured → Active → Open-ended → Settled. Each card shows bank, name, principal, net interest, days-to-maturity badge, and actions.

**Days to Maturity pill:** neutral `{N}d` (>30) → amber `{N}d` (1–30) → `Today` → `{N}d ago` (overdue) / open-ended and settled/closed show `—`. The pill text is the only amber cue — there is no row-level highlight. Post-mutation highlight (ring/bg) comes from `highlightedId`, which auto-clears after 2.5s.

**Actions:** Edit (opens wizard), Settle (confirmation dialog), Delete (confirmation dialog), Close early / Withdraw & close (··· menu, active rows only), Undo settle (··· menu, settled rows only), Reopen (··· menu, closed rows only), Roll over (inside Settle dialog, matured rows only).

#### Withdraw & close / Close early

Available in the `···` menu for any **active** deposit. TDs show "Close early" with a warning banner (maturity date + days remaining). Open-ended savings show "Withdraw & close" with no warning.

Dialog shows: Principal | Accrued net interest | Net proceeds. After confirm: toast with inline Undo.

#### Reopen

Reverts a `closed` deposit back to `active`. In the `···` menu on closed rows (requires "Show inactive" toggled on). No confirmation dialog.

#### Undo settle

Reverts a `settled` deposit back to `matured`. Available in the `···` menu on settled rows when "Show inactive" is toggled on. Pure status revert — no math. Mirrors the Settle handler in reverse.

#### Roll over

Available as a secondary action inside the Settle confirmation dialog (matured deposits only). The dialog shows: `[ Cancel ] [ Roll over ] [ Settle <currency>X ]` — amount only on Settle since Roll over opens an editable wizard.

On Roll over click: dialog closes, wizard opens pre-filled. Fields copied from original deposit: bank, product type, interest rate, tax rate, term, day-count, compounding, interest mode. Fields overridden:

| Field | Value |
| --- | --- |
| Principal | TD maturity → principal + net interest (full proceeds). TD Monthly → original principal (interest already distributed monthly). |
| Start date | Original deposit's maturity date (not today). Editable. |

On wizard submit: original deposit is settled atomically and new deposit is created as active. On wizard discard: no changes; original remains matured.

### Ladder view

Gantt-style timeline of all visible deposits, sorted by start date ASC.

**Desktop** — label column (bank · date range, name, principal + net) + scrollable timeline area with month-axis ticks, today line, and colored bars per deposit. Open-ended bars have a flat right edge (`rounded-r-none`) to signal continuation.

**Mobile** — stacked cards with a two-segment mini progress bar (elapsed | remaining). No "today" label.

**Bar colors by status:** active fixed-term = primary; open-ended = primary/40 (closed open-ended = alert-fill/50); matured = warning-fill; settled = success-fill; closed = alert-fill. Mobile remaining segment = primary/25 (open-ended primary/20).

---

## Cash Flow (`/cashflow`)

Rolling window with filter: **3M / 6M / 12M / All**. Default 12M. Months with no payouts are omitted. Only months ≥ the current calendar month render.

**Expanded (in order):** "At maturity payouts" then "Monthly payouts".
**Current month:** pending + settled pills same as dashboard; row is open by default.

**Open-ended deposits:** Projected as 12 monthly payouts anchored to the deposit's `startDate`. The first projected month is the earliest payout month ≥ the current calendar month.

**Closed deposits:** Excluded from future projections. A ledger entry appears only in the `closeDate` month showing accrued net interest + principal returned, with a "Closed" pill.

---

## Add / Edit Investment Wizard

Single-step centered dialog. Desktop: two-column with live calc right panel. Mobile: compact calc strip below form.

**Global:** No outside-click close. ESC → discard confirm (copy changes when editing). `isDirty` is snapshot-based — edit mode opens clean.

**Submit:** "Add investment" / "Save changes". Disabled until `canSubmit`.

**Edit flow:** `loadDeposit()` pre-fills form and sets `initialState` snapshot → opens clean (not dirty). `buildDeposit` preserves original `id`. `handleSave` preserves original `status` on replace.

### Product types

| Product type | `payoutFrequency` | `interestTreatment` | `isOpenEnded` |
| ------------ | ----------------- | ------------------- | ------------- |
| TD (maturity) | `maturity` | `reinvest` | false |
| TD Monthly | `monthly` | `payout` | false |
| Savings | `maturity` | `reinvest` | configurable |

Payout frequency and interest treatment are **implicit** from the product type — not user-configurable fields.

### Fields (in order)

1. **Bank** — free-text + datalist of existing bank names. Required.
2. **Product type** — radio cards: Time Deposit · TD Monthly Payout · Savings. Required.
3. **Name** — optional label.
4. **Principal** — currency-prefixed input (comma-formatted; `.5` normalizes to `0.5`). Required.
5. **Start date** — date picker. Required.
6. **Interest rate** — flat input or tiered (toggle in label row). Required. Soft warning outside 0.01–25%.
   - Simple → flat rate input.
   - Tiered → tier builder; switching from simple seeds tier rates from current `flatRate`. Switching back restores `flatRate` from `tiers[0].rate`.
7. **Withholding tax** — default 20%, editable. Generic label (no country-specific copy).
8. **Day-count** — `[365][360]` toggle, default 365.
9. **Term** — number input + `Months` / `Days` toggle (no presets). Hidden for Savings when open-ended is ON. `termDays` takes precedence over months when set.
10. **Open-ended switch** — Savings only. ON → hides Term field.
11. **Compounding** — `[Daily][Monthly]` toggle. **Tiered interest mode only** (hidden for simple).
    - TD Monthly: "How often interest is calculated before being distributed to you."
    - TD (maturity) / Savings: "How often interest compounds back into your principal."

---

## Export for AI

Triggered from the Portfolio, Cash Flow, and Investments page headers. Opens a dialog that assembles a Markdown context via `buildAiContext`:

- Editable **prompt** (defaults to a "suggest next best actions" prompt with **Principal Replacement Logic**), optional **market rates** note
- Snapshot header with currency + insurance limit
- Summary (principal, this-month income, next maturity)
- Active deposits table with ⚠ over-limit flags
- Bank exposure table with % of limit
- 12-month cash-flow table
- Flagged risks: overdue / maturing soon / over-limit

Actions: **Copy to clipboard** or **Download** as `yieldflow-context-<date>.md`. Always show the disclaimer: "AI can make mistakes. Always verify calculations and recommendations before acting."

---

## Import / Export (Settings)

**Export JSON** — `{ version, exportedAt, deposits, preferences, theme }`. Preferences included only when non-default (currency ≠ locale default, insurance limit set); theme included only when not "system". **Disabled in demo mode.**

**Import JSON** — validates required deposit fields, shows a **replace-all preview** (all current data replaced) with a confirm dialog, then applies deposits + preferences + theme. Never merges.

**Clear all data** — confirm dialog; wipes deposits and preferences (keeps theme). **Exit Demo** shown instead in demo mode.

Settings also surfaces a collapsible **caveats** block (local-only storage, no backup, etc.).

---

## Demo Mode

- Entry: empty Portfolio landing CTA **"Explore with demo data"**.
- Persisted via `yf:demo-mode`. Demo deposits live in React state only — **never written to `yf:deposits`**. Demo banks come from `lib/data/demo.ts` (7 banks).
- Exit via the demo banner or Settings. Export/Import disabled while in demo.

---

## Multi-currency Display

- Display-only ("vanity"): values are stored and computed currency-free; the picker only changes formatting. Never convert.
- Picker in Settings (`SUPPORTED_CURRENCIES`, 9 codes); default derived from locale (`getLocaleCurrency`). Currency and insurance limit persist in preferences.

---

## Layout

- **AppShell + RouteGuard** wrap all pages. Sidebar renders only once the portfolio is ready.
- Desktop **sidebar** nav: Portfolio (`/`), Investments (`/investments`, with a **matured-count badge**), Cash Flow (`/cashflow`), Settings (`/settings`). "beta" badge next to the logo.
- Mobile **bottom tab bar** with a center `+` that opens the wizard.
- Global **Toaster**, **InvestmentWizard**, and **ExportAiDialog** mounted at the app level.
- **PrototypeBanner** on every page; **DemoBanner** additionally when in demo mode.

---

## Portfolio Rationale

- **Free-text bank names:** Avoids a stale registry. Datalist autocomplete handles repeat entries.
- **Net-only:** Represents spendable reality. Gross creates false expectations.
- **Explicit settle:** Matured TDs may still earn via rollover. Auto-settling misrepresents position.
- **No backend:** Zero-friction to try. localStorage is honest about its constraints; the app surfaces caveats in Settings, not as a persistent nag.
