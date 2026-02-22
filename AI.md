# YieldFlow — AI Engineering Reference

> Read this file before making any changes to the codebase.
> Read `YIELDFLOW_PRODUCT.md` for product and UX decisions.
> Update this file after any major refactor or architectural decision.

---

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + custom CSS variables in `globals.css`
- **UI primitives:** shadcn/ui
- **Icons:** lucide-react
- **Storage:** localStorage via `useLocalStorage` hook (see Storage section)
- **Date utilities:** custom domain functions in `/lib/domain/date.ts`
- **Yield calculations:** `/lib/yield-engine.ts`

---

## File Structure

```
/app                    — Next.js app router pages
/components
  /dashboard            — Dashboard-level components
  /ui                   — shadcn/ui primitives (do not modify directly)
/lib
  /domain               — Pure domain functions (date, format, investment transforms)
  /types.ts             — All shared TypeScript types
  /yield-engine.ts      — Interest calculation engine
  /banks-config.ts      — Bank and product template data (rates, conventions)
  /demo.ts              — Seed data for sample portfolio (relative dates)
```

---

## Types

All shared types live in `/lib/types.ts`. Key types:

```typescript
type TimeDeposit = {
  status?: "active" | "matured" | "settled";
  // "active"  — currently earning, maturity not reached
  // "matured" — maturity date passed, user has NOT settled
  // "settled" — user explicitly clicked Settle — only transition is matured → settled
};
```

**Status rules:**

- `active` → `matured` is automatic when maturity date passes
- `matured` → `settled` happens ONLY when user explicitly clicks "Settle"
- Never auto-settle. Never skip states.
- `active` and `matured` both count toward Total Principal
- Only `settled` is excluded from Total Principal

---

## Domain Rules

### Interest calculations

- All displayed values are **net of withholding tax** unless explicitly labeled otherwise
- Gross values are never shown on dashboard, timeline, or cash flow views
- Principal return is never counted as income
- Use `dayCountConvention` from `banks-config.ts` in all calculations:
  - Simple interest: `principal × rate × (termDays / dayCountConvention)`
  - Daily rate from annual: `annualRate / dayCountConvention`
  - Default to 365 if not set
  - Store the convention used at save time in the deposit record — do not re-read from config on historical records

### Payout types

- **Monthly payout:** recurring net interest paid monthly, principal stays locked
- **Maturity payout:** one-time event, principal returned at end of term
- Principal returned is surfaced in Next Maturity dashboard card only — not in Cash Flow view

### PDIC cap

- Warn (non-blocking) when total balance under one bank approaches ₱1,000,000
- Never block submission — informational only

---

## Storage

**`useLocalStorage` is the intended storage abstraction.**
Direct `localStorage.getItem/setItem` calls anywhere in the codebase are an anti-pattern and should be replaced with the hook.

```typescript
// Correct
const [deposits, setDeposits] = useLocalStorage<TimeDeposit[]>("deposits", []);

// Anti-pattern — do not add more of these
localStorage.setItem("deposits", JSON.stringify(deposits));
```

`persistDeposits` should be a single helper built on top of `useLocalStorage`, not scattered inline mutations.

---

## Formatting

Currency formatting is centralized in `/lib/domain/format.ts`:

```typescript
formatPhpCurrency(value: number): string
```

**Do not add inline `Intl.NumberFormat` calls in components.** If you see them, move to `format.ts`.

---

## Component Architecture

### Intended split (some still in progress):

| Component                  | Responsibility                                  |
| -------------------------- | ----------------------------------------------- |
| `DashboardClient`          | View orchestration only — no domain logic       |
| `usePortfolioData`         | Data fetching, persistence, summary aggregation |
| `useDepositDialogState`    | Dialog open/close, edit target                  |
| `useImportExport`          | Backup download, JSON import                    |
| `WizardShell`              | Wizard step state machine                       |
| `Step1BankProduct`         | Bank + product selection                        |
| `Step2Details`             | Investment detail fields                        |
| `Step3Review`              | Read-only summary + confirm                     |
| `LiveCalcPreview`          | Debounced live calculation panel                |
| `useInvestmentWizardState` | Wizard form state, validation, transitions      |
| `LadderTable`              | Timeline table + mobile cards                   |
| `MonthlyFlow`              | Cash flow grouped by month                      |

### Known oversized files (refactor in progress):

- `DepositFormDialog.tsx` — 1642+ lines, being split into wizard components above
- `DashboardClient.tsx` — mixes orchestration, persistence, mapping; being split into hooks

---

## Tailwind conventions

### Use semantic utilities, not palette classes directly:

```
// Correct
className="bg-surface text-primary border-subtle"

// Avoid
className="bg-slate-800 text-white border-gray-700"
```

### Surface layer tokens (globals.css):

| Token                               | Usage                                |
| ----------------------------------- | ------------------------------------ |
| `bg-surface` / `--surface-1`        | Cards, containers                    |
| `bg-surface-soft` / `--surface-2`   | Table headers, secondary backgrounds |
| `bg-surface-strong` / `--surface-3` | Hover states, tertiary backgrounds   |
| `border-subtle`                     | All borders                          |

### Overdue/status colors — use solid tokens only:

```css
.bg-overdue        /* light: hsl(38 80% 96%)  dark: hsl(38 55% 15%) */
.bg-overdue-sticky /* must match .bg-overdue exactly — used on sticky column cells */
```

**Never use opacity-based colors on sticky or fixed positioned elements.**
Opacity causes text bleed-through when content scrolls beneath sticky columns.
This is a known bug pattern in this codebase.

### Semantic color naming convention:

```
--color-{role}-{variant}-{property}
Examples:
  --color-surface-card-bg
  --color-status-overdue-bg
  --color-status-overdue-fg
  --color-income-net-fg
```

### Shared component classes (add to `@layer components`):

- `.table-sort-btn` — sort header button in LadderTable
- `.action-menu-btn` — kebab menu trigger
- `.danger-ghost-btn` — destructive ghost button (Delete)
- `.status-pill` — Days to Maturity badge

---

## Performance rules

- **Always** wrap sorted/filtered arrays in `useMemo` — especially `LadderTable` sort
- Wizard step components must render lazily — only the current step renders
- Debounce live calculation preview at 300ms
- Use field-level dirty tracking in wizard — not `JSON.stringify` comparison
- Precompute `monthlyEntries` and `maturityEntries` once per `MonthlyFlow` item — not per render

---

## Known bugs / gotchas

- **Sticky column bleed:** opacity-based backgrounds on `TableCell sticky` cause text from scrolling rows to bleed through. Always use solid color tokens.
- **Horizontal scroll border:** border on frozen column should only appear when `scrollLeft > 0`. Listen to `scroll` event on the scroll container, not just `resize`.
- **"0 days" badge:** investments maturing today should show "Due today" in amber, not "0 days" in neutral. Check `formatDaysToMaturity` in `LadderTable`.
- **useLocalStorage unused:** hook exists but `DashboardClient` uses direct localStorage calls. Adopt the hook consistently — do not add more direct calls.

---

## What NOT to do

- Do not add gross values to dashboard, timeline, or cash flow views
- Do not auto-settle investments — only the user can trigger settlement
- Do not use opacity-based colors on sticky/fixed elements
- Do not add direct `localStorage` calls — use `useLocalStorage`
- Do not add inline `Intl.NumberFormat` — use `formatPhpCurrency`
- Do not add tooltips to dashboard cards — fix the label instead
- Do not show principal return as income anywhere
- Do not skip wizard steps programmatically
- Do not close the wizard dialog on outside click — data loss risk
