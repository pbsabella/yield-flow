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
- [ ] Reintroduce chevron expand affordance on Timeline + Cash Flow cards
- [ ] Maturity timeline visualization (Gantt-style, placement → maturity date)
- [ ] Philippine instrument presets (MP2, T-bill discount math)
- [ ] Database / persistent storage (replace localStorage)
- [ ] PWA / installable mobile app
- [ ] Export to PDF summary
- [ ] Encrypted cloud backup option
