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

12-month rolling window. Months with no payouts are omitted (they do not appear as empty rows).

**Expanded:** MONTHLY PAYOUTS (recurring interest) + MATURITY PAYOUTS (one-time, net interest only)
**Current month:** pending + settled pills same as dashboard

**Open-ended deposits:** Projected as 12 monthly payouts anchored to the deposit's `startDate` (not today). The first projected month is the earliest payout month ≥ the current calendar month — so the current month is included when a payout falls within it.

---

## Add / Edit Investment Wizard

Single-step centered dialog. Desktop: two-column with live calc right panel. Mobile: compact calc strip below form.

**Global:** No outside-click close. ESC → discard confirm (copy changes when editing). `isDirty` is snapshot-based — edit mode opens clean.

**Fields (in order):**

1. **Bank** — free-text input with datalist of existing deposit bank names. Required.
2. **Product type** — radio cards: TD (maturity), TD Monthly, Savings. Required. Side-effects: sets `payoutFrequency` and `isOpenEnded`.
3. **Name** — optional label
4. **Principal** — ₱ prefix, required
5. **Start date** — date picker
6. **Interest rate** — flat input or tiered (toggle in label row). Required. Soft warning outside 0.01–25%.
7. **Tax rate** — default 20%, editable, generic description (no Philippines mention)
8. **Day-count** — `[360][365]` toggle, default 365
9. **Compounding** — `[Daily][Monthly]` toggle, default Monthly
10. **Term** — month presets + custom input (hidden for savings + open-ended)
11. **Payout frequency** — TD types only
12. **Open-ended switch** — savings only

**Submit:** "Add investment" / "Save changes". Disabled until `canSubmit`.

**Edit flow:** `loadDeposit()` pre-fills form and sets `initialState` snapshot → opens clean (not dirty). `buildDeposit` preserves original `id`. `DashboardShell.handleSave` preserves original `status` on replace.

---

## Portfolio Rationale

- **Wizard:** Lowers cognitive load — users shouldn't need to know day-count conventions or tax math
- **Net-only:** Represents spendable reality. Gross creates false expectations.
- **Explicit settle:** Matured TDs may still earn via rollover. Auto-settling misrepresents position.
