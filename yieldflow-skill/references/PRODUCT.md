# YieldFlow — Product Reference

> What YieldFlow does and why. No engineering conventions here.
> For how to build it: read `ENGINEERING.md`.

---

## Overview

YieldFlow is a yield ladder tracker for savers who spread money across
multiple bank products — time deposits, savings accounts, and digital bank
offerings. Local-first, no accounts, no servers.

**Key differentiator:** Everything stays on the user's device.

---

## Design Principles

- **Net only** — gross values never appear in any primary view
- **No tooltips** — labels are written clearly enough to be self-explanatory
- **User controls state** — investments are never auto-archived
- **Mobile-first** — cards stack cleanly on small screens
- **Clean, calm, financial** — not gamified

---

## Supported Investment Types

| Type                   | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| Time Deposit (TD)      | Fixed term, principal + interest returned at maturity  |
| TD with Monthly Payout | Interest paid monthly, principal locked until maturity |
| Open-ended / Savings   | No maturity date, ongoing monthly interest             |

---

## Investment Status

| Status    | Description                                          |
| --------- | ---------------------------------------------------- |
| `active`  | Earning interest, maturity not reached               |
| `matured` | Maturity date passed, user has not settled           |
| `settled` | User explicitly clicked "Settle" — investment closed |

**Transitions:**

- `active` → `matured` — automatic when maturity date passes
- `matured` → `settled` — only when user explicitly clicks "Settle"
- No automatic settlement ever occurs

**For calculations:**

- `active` and `matured` both count toward Total Principal
- `settled` is excluded from Total Principal

---

## Display Rules

- All values shown are **net of withholding tax**
- Gross interest is never shown in primary views
- Principal return is never counted as income
- Principal returned is surfaced in Next Maturity card only — not Cash Flow

---

## Dashboard

Three summary cards. No tooltips. Stack vertically on mobile.

### Total Principal

- Sum of principal where status is `active` or `matured`
- Subtext: "Excludes settled investments."

### Income This Month

- Net interest earned this calendar month
- **Pending pill** — net interest where status is `matured`, maturity in current month
- **Settled pill** — net interest where status is `settled`, maturity in current month
- Each pill hidden when value is zero

### Next Maturity

- Next investment due to mature (status: active)
- Shows: date, name, bank, net proceeds (principal + net interest)
- Empty state: "All settled for now — add a new investment to see the next maturity."

---

## Timeline View

Investments sorted by maturity date ascending (nearest first).

### Desktop Table

Columns: Investment | Bank | Principal | Maturity | Days to Maturity | Net Interest | Actions

**Days to Maturity pill:**

- Normal: neutral pill — "7 days"
- Due today: amber pill — "Due today"
- Overdue: amber pill — "Overdue 3 days"
- Open-ended: plain "—", no pill

### Mobile Cards

**Collapsed:** Investment name + Bank | Maturity date + Net interest + chevron
**Expanded:** Principal, Maturity date, Days to Maturity pill, Net Interest
**Overdue:** Card highlighted amber, "Settle" CTA visible

### Show Settled Filter

- Default: off — settled investments hidden
- When on: settled appear at bottom, dimmed 50%, no Settle CTA

### Actions (Kebab Menu)

- Edit — opens wizard in edit mode
- Delete — removes with confirmation

---

## Cash Flow View

Monthly passive income grouped by calendar month.

### Timeline

- Default: 12-month rolling window from current month
- Months with no payouts: single muted collapsed row
- "Show all" to view beyond 12 months

### Monthly Card — Collapsed

- Month + year | NET INCOME label + net amount
- Current month only: pending and settled pills

### Monthly Card — Expanded

**MONTHLY PAYOUTS** — recurring interest from monthly payout TDs
**MATURITY PAYOUTS** — one-time TD end events, net interest only

---

## Add Investment Wizard

A guided 3-step wizard. Supports Add and Edit flows.
Dynamic — only relevant fields shown based on prior selections.

### Layout

- **Desktop:** Two-column dialog. Left: steps. Right: live calculation preview (debounced 300ms).
- **Mobile:** Full-screen sheet. Live calc collapses to sticky bottom bar, expands on tap.

### Global Rules

- Clicking outside does NOT close — prevents data loss
- ESC shows discard confirmation: "Discard changes?" with "Keep editing" / "Discard"
- Step indicator always visible
- Back always visible on Steps 2 and 3
- No step is skippable

### Step 1 — Bank & Product

- Bank selector — searchable, preset list + "+ Add custom bank"
- Product type selector — renders only after bank selected
- "Next" disabled until both selected

**Custom bank inline form:**

- Expands below bank selector — does not navigate away
- Fields: Bank name (required), Tax rate (pre-filled 20%), PDIC member (checkbox)
- Validation fires only on "Save bank" — not on blur
- Product type selector hidden while form is open
- Cancel: dismisses form, bank selector returns to empty

**Changing bank after returning to Step 1:**

- Product type resets
- Rate and term fields in Step 2 clear
- Inline prompt: "Changing the bank will reset product and rate fields. Principal and start date will be kept."

**Changing product type:**

- Rate and term fields reset
- Principal and start date preserved

### Step 2 — Investment Details

**Always shown:**

- Investment name — auto-suggested "[Bank] - [Product]", editable
- Principal — ₱, thousand separators on blur, must be > 0
- Start date — defaults to today
- Interest rate — pre-filled from template, always editable
  - Subtext: "Starting point only — verify with your bank · Last updated [date]"
- Withholding tax — pre-filled 20%, editable

**Interest Rate group:**

- Single rate input and tiered toggle live together as one group
- When tiered toggle ON: flat rate replaced by tier builder within same group
  - First tier pre-populated with whatever was in the flat rate field
  - Each tier row: "Up to ₱[ceiling]" input | rate input | remove button
  - Final tier: ceiling replaced by read-only label "Above ₱[previous ceiling]"
  - "+ Add tier" button below rows
- Toggling OFF: tier builder collapses, flat rate restored with first tier's value

**Fixed-term products only:**

- Term — month input with shortcut pills (1M, 3M, 6M, 12M, 24M) + "or pick end date" toggle
  - Toggle converts value, does not reset
- Payout frequency — "At maturity" / "Monthly"
- Compounding — "Daily" / "Monthly"

**Savings / Open-ended only:**

- Open-ended toggle — pre-checked, uncheck to add maturity date
- Compounding

**Validation:**

- Fires on blur, not keystroke
- Rate outside 0.01%–25%: soft warning
- Principal ≤ 0: hard error
- Tax rate: single field in Step 2 only — read-only in Step 3

### Step 3 — Review & Confirm

- Read-only summary of all inputs
- Tax rate shown read-only — not editable here
- Net interest shown prominently
- Deposit insurance warning if applicable
- "Back" returns to Step 2, all values preserved
- CTA: "Add investment" (Add) / "Save changes" (Edit)
- No confirmation after submit
- On success: closes, investment appears in Timeline immediately

### Edit Flow

- Opens at Step 2 with all values pre-filled
- Step 1 shown as collapsed summary with "Change" link
- Same downstream reset rules as Add flow

---

## Bank + Product Templates (`banks-config.ts`)

Rates are starting point suggestions — not live data.
All pre-filled rates show: "Last updated [date] — verify with your bank."

**Deposit insurance monitor:**

- Warn non-blocking when total at one bank approaches the insured limit
- Shown at Step 1 and repeated at Step 3
- Never blocks submission

**Tiered rate warning:**

- Warn if principal crosses a tier threshold
- Available for all banks, pre-configured for known tiered products
- Shown as a flag, not an automatic recalculation

---

## Empty State

- Heading: "No investments yet"
- Body: "Load sample data to explore YieldFlow instantly."
- CTA: "Load sample data" / "Reload sample data" after first load

---

## Data Management

- Download Backup (JSON)
- Import JSON
- Clear All Data — destructive, styled in red

---

## Global Copy

| Element      | Copy                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| Alert banner | "Work in progress — YieldFlow is actively being built."                  |
| Data section | "Your data stays on your device — no accounts, no servers, no tracking." |

---

## Backlog

- [ ] Maturity timeline visualization (Gantt-style)
- [ ] Global instrument presets (T-bills, government bonds)
- [ ] Database / persistent storage (replace localStorage)
- [ ] PWA / installable mobile app
- [ ] Export to PDF summary
- [ ] Encrypted cloud backup

---

## Portfolio Notes

- **Why a wizard instead of a form?** Eliminates financial terminology burden.
  Users should not need to know their bank's calculation model.
- **Why net-only display?** Gross is the bank's number. What users actually
  receive and can spend is net. Showing gross creates false expectations.
- **Why explicit settle action?** Money in a matured TD may still be earning
  depending on rollover policy. Auto-settling would misrepresent the user's
  actual position.
