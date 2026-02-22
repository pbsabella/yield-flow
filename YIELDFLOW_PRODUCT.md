# YieldFlow – Product Documentation

> Version 1.0 · February 2026  
> A yield ladder tracker for Philippine investors. Local-first, no accounts, no servers.

---

## Overview

YieldFlow helps users track fixed-income investments, visualize maturity timing, and see their passive income clearly.

**Primary user goal:** Generate and monitor passive income from fixed-income instruments across multiple banks.

**Target user:** Philippine investors managing a yield ladder, previously tracking in Google Sheets.

**Key differentiator:** Local-only storage — everything stays on the user's device. No accounts, no servers, no tracking.

---

## Supported Investment Types

| Type                   | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Time Deposit (TD)      | Fixed term, principal + interest returned at maturity                              |
| TD with Monthly Payout | Long TDs where interest is paid out monthly; principal stays locked until maturity |
| Open-ended / Savings   | No maturity date; ongoing monthly interest (e.g. Maya SA, MariBank)                |

---

## Core Data Rules

### Investment Status

An investment has three possible states:

| Status    | Description                                                 |
| --------- | ----------------------------------------------------------- |
| `active`  | Currently earning interest, maturity date has not passed    |
| `matured` | Maturity date has passed but user has not yet settled       |
| `settled` | User has explicitly clicked "Settle" — investment is closed |

**Transitions:**

- `active` → `matured` — automatic when maturity date passes
- `matured` → `settled` — only when user explicitly clicks "Settle"
- No automatic settlement ever occurs

### Active vs Settled (for calculations)

An investment counts as **active** (included in Total Principal) when `status === "active"` or `status === "matured"`. It is excluded only when `status === "settled"`.

### Payout Types

| Type            | Behavior                                                       |
| --------------- | -------------------------------------------------------------- |
| Monthly Payout  | Recurring net interest paid each month; principal stays locked |
| Maturity Payout | One-time event at TD end; principal is returned                |

### Values

- All displayed values are **net of withholding tax** unless explicitly labeled otherwise
- Gross values are never shown on the dashboard, timeline, or cash flow views
- Principal return is never counted as income

---

## Design Principles

- **Net only** — gross values do not appear in any primary view
- **No tooltips** — labels are written clearly enough to be self-explanatory
- **User controls state** — investments are never auto-archived; user explicitly settles
- **Mobile-first** — cards stack cleanly on small screens; no horizontal scroll on mobile
- **Clean, calm, financial** — not gamified

---

## Global Copy

| Element                 | Copy                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero tagline            | "Track your fixed-income investments, visualize maturity timing, and see your passive income clearly."                                        |
| Alert banner title      | "Work in progress"                                                                                                                            |
| Alert banner body       | "YieldFlow is actively being built. Some features may change as I refine the experience — your data and feedback help shape what comes next." |
| Data Management heading | "Your data stays on your device"                                                                                                              |
| Data Management body    | "Everything is stored privately on this device — no accounts, no servers, no tracking. Use the backup option to keep a copy safe."            |

---

## Dashboard

Three summary cards displayed at the top of the page. No tooltips — labels are self-explanatory. Cards stack vertically on mobile.

### Card 1 — Total Principal

- Cumulative principal of investments where `status === "active"` or `status === "matured"`
- Excludes `status === "settled"` investments
- Subtext: "Excludes settled investments."

### Card 2 — Income This Month

- Net interest/yield only — not principal return
- Represents passive income earned this calendar month, net of withholding tax
- Shows whole month total regardless of settled state
- **Pending pill** — sum of net interest where `status === "matured"` and maturity falls in current month
- **Settled pill** — sum of net interest where `status === "settled"` and maturity falls in current month
- Each pill hidden individually when its value is zero
- Label: "Income This Month" · Subtext: "Net interest · [Month Year]"

### Card 3 — Next Maturity

- Shows the next investment due to mature (status: active)
- Displays: date, investment name, bank/institution, net proceeds (principal + interest)
- Net proceeds shown so user knows how much cash is available to redeploy
- Empty state: "All settled for now — add a new investment to see the next maturity."

---

## Timeline View

Displays investments sorted by maturity date ascending (nearest first).

### Desktop Table

Columns: Investment | Bank | Principal | Maturity | Days to Maturity | Net Interest | Actions

**Days to Maturity** — displayed as a styled pill/tag:

- Normal state: neutral/grey pill, e.g. "7 days"
- Overdue state: amber/warning pill, e.g. "Overdue 3 days"
- Open-ended: plain "—", no pill

**Net Interest** — currency value only, no decorative icons

**Horizontal scroll** — enabled on smaller desktop/laptop screens:

- Investment column (leftmost) is frozen during scroll
- Frozen column has a subtle right-side shadow
- Full table fits without scrolling on large screens

### Mobile Expandable Cards

**Collapsed state:**

- Left: Investment name + Bank name
- Right: Maturity date + Net interest + chevron toggle
- Kebab menu (⋯) in top-right, always accessible without expanding

**Expanded state:**

- Principal
- Maturity date
- Days to Maturity (pill/tag)
- Net Interest

**Overdue state (`status === "matured"`):**

- Card highlighted in yellow
- "Settle" CTA visible in collapsed state alongside kebab menu

### Show Settled Filter

- Label: "Show settled"
- Displayed as a subtle filter chip or checkbox above the investment list
- Default: off — settled investments hidden
- When on: settled investments appear at the bottom of the list, dimmed at ~50% opacity
- No yellow highlight or Settle CTA on settled rows — kebab only (Edit, Delete)

### Actions (Kebab Menu)

- Edit — opens investment edit form
- Delete — removes investment with confirmation

---

## Cash Flow View

Displays monthly passive income grouped by calendar month. Consistent layout on desktop and mobile.

### Timeline Behavior

- Default: 12-month rolling window from the current month
- Months with no payouts: shown as a single muted collapsed row
- "Show all" control at the bottom to view beyond 12 months

### Monthly Card — Collapsed

- Left: Month + year
- Right: "NET INCOME" label + net amount
- **Current month only:** Pending and settled pills shown below the amount, same logic as dashboard Income This Month card
- Each pill hidden when value is zero

### Monthly Card — Expanded

Two clearly labeled sections:

**MONTHLY PAYOUTS**

- Recurring interest from TD monthly payout investments
- Each row: Investment name · Bank name (left) | Net interest amount (right)
- Subtext per row: "Net interest"

**MATURITY PAYOUTS**

- One-time TD end events
- Each row: Investment name · Bank name (left) | Net interest amount (right)
- Subtext per row: "Net interest"
- Principal returned is not shown in this view — surfaced in Next Maturity dashboard card

---

## Empty State

Shown when no investments have been added.

- Heading: "No investments yet"
- Body: "Load sample data to explore YieldFlow instantly."
- CTA: "Load sample data"
- Dashboard cards display ₱0 with no pending/settled pills
- Next Maturity card displays empty state message

---

## Data Management

Located at the bottom of the page.

- "Saved to Browser" — confirmation badge showing data is persisted
- **Download Backup (JSON)** — exports all investment data as a JSON file
- **Import JSON** — restores from a previously downloaded backup
- **Clear All Data** — destructive action, styled in red

---

## Backlog

- [ ] Add Investment form
- [ ] Edit Investment form
- [ ] Maturity timeline visualization (Gantt-style, placement → maturity date)
- [ ] Philippine instrument presets (MP2, T-bill discount math)
- [ ] Database / persistent storage (replace localStorage)
- [ ] PWA / installable mobile app
- [ ] Export to PDF summary
- [ ] Encrypted cloud backup option

---

## Add Investment Wizard — Detailed User Flow

### Overview

A guided 3-step wizard that eliminates the need for users to understand banking calculation models or guess at rates. Supports both Add and Edit flows. Dynamic — only shows relevant fields based on previous selections.

### Layout

- **Desktop:** Two-column dialog. Left: wizard steps. Right: live calculation preview, debounced 300ms.
- **Mobile:** Single column, full-screen sheet. Live calculation collapses to a sticky bottom bar, expands on tap.
- **Both:** Fully accessible — keyboard navigation, visible focus rings, ARIA labels. Light and dark mode supported.

### Global Rules

- Clicking outside dialog does NOT close it — prevents accidental data loss
- ESC key shows discard confirmation: "Discard changes? Your inputs will be lost." with "Keep editing" and "Discard" options
- Step indicator always visible showing current step of 3
- Back button always visible on Steps 2 and 3
- No step is skippable — forward navigation requires valid data

---

### Step 1 — Bank & Product

**Initial state:**

- Bank selector shown, empty
- Product type selector NOT rendered — appears only after bank is selected
- "Next" CTA disabled until both bank and product type are selected

**Selecting a preset bank:**

- Dropdown closes, bank shown in field
- Product type selector renders below
- Options driven by selected bank's products from `banks-config.ts`
- No validation shown yet

**Selecting "+ Add custom bank":**

- Dropdown closes immediately
- Bank selector field shows "Custom bank" placeholder
- Inline form expands BELOW the bank selector — does not navigate away
- Inline form fields: Bank name (required), Tax rate (pre-filled 20%), PDIC member (checkbox)
- Validation fires only on "Save bank" click, not on blur
- Product type selector NOT shown while inline form is open
- "Cancel" dismisses form, bank selector returns to empty

**After saving custom bank:**

- Inline form collapses
- New bank auto-selected in bank selector
- Product type selector renders with generic options: TD Maturity, TD Monthly Payout, Savings / Open-ended

**Selecting a product type:**

- "Next" CTA becomes enabled

**Clicking "Next":**

- Validates bank and product type selected
- If valid: transitions to Step 2, Step 1 values shown in collapsed summary at top
- If invalid: inline field errors shown, does not navigate

**Returning to Step 1 from Step 2:**

- All Step 1 values restored exactly as left
- No validation fires on return
- Changing bank: product type resets, Step 2 rate and term fields clear, inline prompt shown: "Changing the bank will reset product and rate fields. Principal and start date will be kept."
- Changing product type: rate and term fields in Step 2 reset, principal and start date preserved

---

### Step 2 — Investment Details

Fields shown depend on product type from Step 1. Only relevant fields render.

**Always shown:**

- Investment name — auto-suggested as "[Bank] - [Product type]", editable
- Principal amount — ₱, formatted with thousand separators on blur, must be > 0
- Start date — defaults to today
- Interest rate — pre-filled from template, editable, labeled "Starting point only — verify with your bank" with "Last updated [month year]" disclaimer
- Withholding tax rate — pre-filled 20%, editable, labeled "Standard PH rate is 20%"

**Fixed-term products only (TD Maturity, TD Monthly Payout):**

- Term — month input with shortcut pills (1M, 3M, 6M, 12M, 24M) and "or pick end date" toggle. Toggling converts value, does not reset.
- Payout frequency — pre-selected from template, toggle: "At maturity" / "Monthly"
- Compounding — pre-selected from template, toggle: "Daily" / "Monthly"

**Savings / Open-ended only:**

- Open-ended toggle — pre-checked, uncheck to add a maturity date
- Compounding — pre-selected from template

**Conditional — all products:**

- Tiered rate toggle — available for all, pre-checked for known tiered banks
- When on: tier builder renders below rate field. Each tier: "Up to ₱[amount] — [rate]%". "Add tier" button. Final tier has no upper limit.
- When off: single flat rate field shown
- Warning if principal crosses tier threshold

**Validation:**

- Fires on field blur, not on keystroke
- "Next" enabled as soon as required fields have any value — final validation on click
- Rate outside 0.01%–25%: soft warning, not hard error
- Principal ≤ 0: hard error

**Live calculation preview:**

- Shows: gross interest, tax withheld, net interest, maturity date
- Monthly net interest shown for monthly payout products
- Empty state: "Enter principal and rate to see your projection"
- Tiered: shows breakdown per tier

**Clicking "Next":**

- Validates all required fields
- If valid: transitions to Step 3, Step 2 values shown in collapsed summary
- If invalid: inline errors shown, does not navigate

---

### Step 3 — Review & Confirm

- Read-only summary of all inputs from Steps 1 and 2
- Tax rate shown as read-only value — not an editable field here
- Net interest calculation shown prominently
- Maturity date shown for fixed-term
- Monthly net interest shown for monthly payout
- PDIC warning if total balance with selected bank approaches ₱1,000,000
- "Back" returns to Step 2 with all values preserved
- Primary CTA: "Add investment"
- No confirmation dialog after submit
- On success: dialog closes, investment appears immediately in Timeline sorted by maturity date
- On error: inline error shown, dialog stays open

---

### Edit Flow

- Wizard opens at Step 2 with all values pre-filled
- Step 1 shown as collapsed summary at top with "Change" link
- Clicking "Change" expands Step 1 with current values pre-selected
- Changing bank or product shows inline prompt: "Changing product type will reset rate and term. Principal and start date will be kept."
- Primary CTA at Step 3: "Save changes"
- On success: dialog closes, investment updated in place in Timeline

---

## Bank + Product Template (`banks-config.ts`)

```typescript
type BankProduct = {
  id: string;
  bankId: string;
  name: string;
  productType: "td-maturity" | "td-monthly" | "savings";
  defaultRate: number;
  defaultTermMonths?: number;
  defaultPayoutFrequency: "maturity" | "monthly";
  defaultCompounding: "daily" | "monthly";
  defaultTaxRate: number;
  dayCountConvention: 360 | 365;
  isOpenEnded?: boolean;
  isTiered?: boolean;
  defaultTiers?: InterestTier[];
  pdicMember: boolean;
  lastUpdated: string; // "2026-02"
  notes?: string;
};
```

**Day count convention** is used in the yield engine for all interest calculations:

- Simple interest: `principal × rate × (termDays / dayCountConvention)`
- Daily rate from annual: `annualRate / dayCountConvention`
- Default to 365 if not set
- Store convention used at calculation time in the deposit record so historical calculations don't drift if template is updated

**Rate disclaimer:** All pre-filled rates show "Last updated [lastUpdated] — verify with your bank." These are starting point suggestions, not live rates.

---

## Safety & Risk Guardrails

**PDIC Cap Monitor:**

- Aggregates all active investments under the selected bank
- Warning shown at Step 1 and repeated at Step 3 if total approaches ₱1,000,000
- Non-blocking — informational only, does not prevent submission
- Copy: "Your total balance with [Bank] will be near the ₱1,000,000 PDIC insurance limit. Consider spreading across banks."

**Tiered Rate Warning:**

- If principal crosses a tier threshold, warn: "Your principal of ₱[amount] spans multiple rate tiers. Rates have been split accordingly."
- Available for all banks, pre-configured for MariBank and Maya SA
- Shown as a flag, not an automatic recalculation
