# YieldFlow — Product Reference

> What to build and why. No engineering conventions here.
> For how to build it: read ENGINEERING.md.

---

## Investment Types

| Type                 | Description                                  |
| -------------------- | -------------------------------------------- |
| Time Deposit (TD)    | Fixed term, principal + interest at maturity |
| TD Monthly Payout    | Interest paid monthly, principal locked      |
| Open-ended / Savings | No maturity date, ongoing monthly interest   |

---

## Domain Logic

| Concept       | Rule                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Display       | Net of tax only. Principal return is not income.                                                      |
| Status        | `active` → `matured` (auto) → `settled` (explicit). Or `active` → `closed` (explicit early closure). |
| Principal     | `active` + `matured` count. `settled` and `closed` excluded.                                          |
| Interest Mode | `simple` (flat rate) or `tiered` (brackets by principal balance)                                      |
| Term input    | Months (default) **or** `termDays` (takes precedence when set)                                        |
| Day-count     | 360 or 365 toggle; default 365                                                                        |

---

## Dashboard

### KPI

**Total Principal** — active + matured only. Subtext: "Excludes settled."
**Income This Month** — net interest this month. Pending + settled pills, hidden when zero.
**Next Maturity** — next active investment. Shows date, name, bank, net proceeds.

### Top 3 next payouts

Upcoming scheduled payout events (maturity or interest), sorted by date ASC. Shows deposit name, bank, date, and net amount. Hidden when no payouts are imminent.

### Exposure by Bank

Principal breakdown per bank for active deposits only, with insurance coverage percentage when a limit is configured in Settings. Color-coded: green ≤ 80%, amber > 80%, red > 100% of limit. Shown as a collapsible ("Active summary") on the Investments page; may also surface on the Dashboard.

---

## Investments (`/investments`)

Controls: bank filter select, Show settled toggle (off by default), List / Ladder view toggle.

**Active summary strip** — collapsible (defaults closed). Shows principal + net interest per bank with insurance coverage %. See "Exposure by Bank" above.

### List view

**Desktop table** — horizontally scrollable; Deposit column frozen (sticky left). Sorted by days-to-maturity ASC by default. All columns sortable.

**Mobile cards** — grouped by status: Matured → Active → Open-ended → Settled. Each card shows bank, name, principal, net interest, days-to-maturity badge, and actions.

**Days to Maturity pill:** neutral → "7 days" → "Due today" / amber → "Overdue X days" / open-ended → "—"
**Matured/overdue row:** amber highlight; Settle CTA visible.
**Show inactive toggle:** closed and settled deposits hidden by default; shown when toggled on.
**Actions:** Edit (opens wizard), Settle (confirmation dialog), Delete (confirmation dialog), Close early / Withdraw & close (··· menu, active rows only), Undo settle (··· menu, settled rows only), Reopen (··· menu, closed rows only), Roll over (inside Settle dialog, matured rows only).

#### Withdraw & close / Close early

Available in the `···` menu for any **active** deposit. TDs show "Close early" with a warning banner (maturity date + days remaining). Open-ended savings show "Withdraw & close" with no warning.

Dialog shows: Principal | Accrued net interest | Net proceeds. After confirm: toast with inline Undo.

#### Reopen

Reverts a `closed` deposit back to `active`. In the `···` menu on closed rows (requires "Show inactive" toggled on). No confirmation dialog.

#### Undo settle

Reverts a `settled` deposit back to `matured`. Available in the `···` menu on settled rows when "Show inactive" is toggled on. Pure status revert — no math. Mirrors the Settle handler in reverse.

#### Roll over

Available as a secondary action inside the Settle confirmation dialog (matured deposits only). The dialog shows: `[ Cancel ] [ Roll over ] [ Settle ₱X ]` — amount only on Settle since Roll over opens an editable wizard.

On Roll over click: dialog closes, wizard opens pre-filled. Fields copied from original deposit: bank, product type, interest rate, tax rate, term, day-count, compounding, interest mode. Fields overridden:

| Field | Value |
| --- | --- |
| Principal | TD maturity → principal + net interest (full proceeds). TD Monthly → original principal (interest already distributed monthly). |
| Start date | Original deposit's maturity date (not today). Editable. |

On wizard submit: original deposit is settled atomically and new deposit is created as active. On wizard discard: no changes; original remains matured.

### Ladder view

Gantt-style timeline of all visible deposits, sorted by start date ASC.

**Desktop** — label column (bank · date range, name, principal + net) + scrollable timeline area with month-axis ticks, today line, and colored bars per deposit. Bar style: `rounded-bar` corners; open-ended bars have a flat right edge (`rounded-r-none`) to signal continuation.

**Mobile** — stacked cards with a two-segment mini progress bar (elapsed | remaining), today label, and date range.

**Bar colors by status:** active fixed-term = primary; open-ended = primary/40; matured = status-warning; settled = muted/50.

---

## Cash Flow

Rolling window with filter: **3M / 6M / 12M / All**. Default 12M. Months with no payouts are omitted.

**Expanded:** MONTHLY PAYOUTS (recurring interest) + MATURITY PAYOUTS (one-time, net interest only)
**Current month:** pending + settled pills same as dashboard; row is open by default

**Open-ended deposits:** Projected as 12 monthly payouts anchored to the deposit's `startDate`.
The first projected month is the earliest payout month ≥ the current calendar month.

**Closed deposits:** Excluded from future projections. A single historical entry appears in the `closeDate` month showing accrued net interest + principal returned, with a "Closed" pill.

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
2. **Product type** — radio cards: TD (maturity) · TD Monthly · Savings. Required.
3. **Name** — optional label.
4. **Principal** — currency-prefixed input. Required.
5. **Start date** — date picker. Required.
6. **Interest rate** — flat input or tiered (toggle in label row). Required. Soft warning outside 0.01–25%.
   - Simple → flat rate input.
   - Tiered → tier builder; switching from simple seeds tier rates from current `flatRate`. Switching back restores `flatRate` from `tiers[0].rate`.
7. **Withholding tax** — default 20%, editable. Generic label (no country-specific copy).
8. **Day-count** — `[360][365]` toggle, default 365.
9. **Term** — month presets + custom input. Hidden for Savings when open-ended is ON. Also accepts `termDays` (takes precedence over months when set).
10. **Open-ended switch** — Savings only. ON → hides Term field.
11. **Compounding** — `[Daily][Monthly]` toggle. **Tiered interest mode only** (hidden for simple).
    - TD Monthly: "How often interest is calculated before being distributed to you."
    - TD (maturity) / Savings: "How often interest compounds back into your principal."

---

## Portfolio Rationale

- **Free-text bank names:** Avoids a stale registry. Datalist autocomplete handles repeat entries.
- **Net-only:** Represents spendable reality. Gross creates false expectations.
- **Explicit settle:** Matured TDs may still earn via rollover. Auto-settling misrepresents position.
- **No backend:** Zero-friction to try. localStorage is honest about its constraints; the app surfaces caveats in Settings, not as a persistent nag.
