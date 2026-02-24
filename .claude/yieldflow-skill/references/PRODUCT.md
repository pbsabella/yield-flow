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

| Concept   | Rule                                                                |
| --------- | ------------------------------------------------------------------- |
| Display   | Net of tax only. Principal return is not income.                    |
| Status    | `active` → `matured` (auto) → `settled` (explicit user action only) |
| Principal | `active` + `matured` count. `settled` excluded.                     |

---

## Dashboard

**Total Principal** — active + matured only. Subtext: "Excludes settled."
**Income This Month** — net interest this month. Pending + settled pills, hidden when zero.
**Next Maturity** — next active investment. Shows date, name, bank, net proceeds.

---

## Timeline

Sorted by maturity ASC. Desktop table + mobile expandable cards.

**Days to Maturity pill:** neutral → "7 days" → "Due today" / amber → "Overdue 3 days" / open-ended → "—"
**Overdue card:** amber highlight, Settle CTA visible
**Show settled toggle:** off by default, settled dimmed 50% at bottom when on
**Actions:** Edit (opens wizard), Delete (with confirmation)

---

## Cash Flow

12-month rolling window. Months with no payouts show collapsed muted row.

**Expanded:** MONTHLY PAYOUTS (recurring interest) + MATURITY PAYOUTS (one-time, net interest only)
**Current month:** pending + settled pills same as dashboard

---

## Add Investment Wizard

2-step, dynamic. Desktop: two-column with live calc right panel. Mobile: full-screen.

**Global:** No outside-click close. ESC → discard confirm. No step skipping. Back preserves all values.

**Step 1 — Bank & Product**

- Searchable bank selector + "+ Add custom bank" (inline form below, not a new screen)
- Custom bank form: name, tax rate (20%). Validates on Save only.
- Product type renders only after bank selected
- Changing bank resets product + rate + term. Principal + start date preserved.
- Empty state on live calc right panel. Nothing to show yet.

**Step 2 — Investment Details**

- Always: name (auto-suggested), principal, start date, rate (pre-filled, always editable), tax (20%)
- Rate group: flat rate + tiered toggle together. Toggle ON → tier builder replaces flat input, pre-fills first tier from flat value. Toggle OFF → restores flat rate from first tier.
- Fixed-term only: term (month pills + end date toggle), payout frequency, compounding
- Savings only: open-ended toggle, compounding
- Validation on blur. Soft warning outside 0.01–25%. Hard error principal ≤ 0.
- Tax rate editable here
- "Add investment" / "Save changes" (edit mode)

**Edit flow:** Opens at Step 2 pre-filled. Step 1 as collapsed summary with Change link.

---

## Portfolio Rationale

- **Wizard:** Lowers cognitive load — users shouldn't need to know day-count conventions or tax math
- **Net-only:** Represents spendable reality. Gross creates false expectations.
- **Explicit settle:** Matured TDs may still earn via rollover. Auto-settling misrepresents position.
