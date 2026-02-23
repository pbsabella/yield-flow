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

## Tailwind v4 — how it works

This project uses **Tailwind CSS v4**. There is no `tailwind.config.ts` for colors.
All theme configuration lives in `globals.css` inside `@theme inline`.

**The token chain:**

```
:root / .dark          — raw HSL values (source of truth)
     ↓
@theme inline          — exposes tokens to Tailwind as utility classes
     ↓
@layer utilities       — single-property semantic utilities (.bg-surface, .text-income-net)
@layer components      — multi-property reusable patterns (.table-sort-btn, .status-pill)
     ↓
CVA / className        — consumed in components
```

**To add a new token:**

1. Add raw value to `:root` and `.dark`
2. Expose in `@theme inline` so Tailwind generates the utility
3. Use as a Tailwind class in components

**Never use `bg-[var(--token)]` inline** — if you need a CSS variable as a
Tailwind class, register it in `@theme inline` first. Then use the generated class.

---

## Token naming convention

All tokens follow:

```
--color-{role}-{variant}-{property}
```

Examples:

```
--color-surface-card-bg
--color-status-overdue-bg
--color-status-overdue-fg
--color-status-overdue-border
--color-income-net-fg
--color-interactive-hover-bg
--color-interactive-active-bg
--color-interactive-selected-bg
--color-interactive-selected-border
--color-bank-name-fg
--color-danger-bg
--color-danger-fg
--color-danger-border
--color-danger-hover
--color-danger-active
```

Token names are **identical** across light and dark — only values swap inside `.dark`.

---

## Token reference

### Surface layers

| Utility             | Token                       | Usage                       |
| ------------------- | --------------------------- | --------------------------- |
| `bg-page`           | `--color-surface-page`      | Page background             |
| `bg-surface`        | `--color-surface-base`      | Cards, containers           |
| `bg-surface-soft`   | `--color-surface-soft`      | Table headers, secondary bg |
| `bg-surface-strong` | `--color-surface-raised`    | Hover states, tertiary bg   |
| `bg-item-card`      | `--color-surface-item-card` | Individual investment cards |
| `border-subtle`     | `--border`                  | All borders                 |

### Status colors

| Utility                                                         | Usage                                       |
| --------------------------------------------------------------- | ------------------------------------------- |
| `bg-overdue` / `bg-overdue-sticky`                              | Overdue investment rows                     |
| `text-overdue` / `border-overdue`                               | Overdue text and borders                    |
| `bg-status-info` / `text-status-info-fg` / `border-status-info` | Indigo tint — wizard preview, sample banner |
| `bg-warning` / `text-warning` / `border-warning`                | Amber warning states                        |
| `bg-status-success` / `text-status-success-fg`                  | Emerald success states                      |

### Interactive states

| Utility                              | Usage                                      |
| ------------------------------------ | ------------------------------------------ |
| `bg-interactive-hover`               | Hover background on tabs, toggles, buttons |
| `bg-interactive-active`              | Press/active background                    |
| `bg-interactive-selected`            | Selected state background                  |
| `border-interactive-selected-border` | Selected state border (tabs)               |

### Semantic colors

| Utility                | Usage                                            |
| ---------------------- | ------------------------------------------------ |
| `text-income-net`      | Net interest values — indigo, all views          |
| `text-bank-name`       | Bank name labels — sky/teal, all views           |
| `bg-danger-solid`      | Solid danger button bg (Delete, Discard)         |
| `text-danger-fg`       | Danger text (error messages, destructive labels) |
| `border-danger-border` | Danger input borders (validation errors)         |

### Typography

| Utility          | Usage                              |
| ---------------- | ---------------------------------- |
| `text-badge`     | 11px — badge labels, pill text     |
| `font-financial` | Tabular nums — all currency values |

---

## Token rules — never break these

**1. Never hardcode palette classes for semantic meaning:**

```typescript
// Wrong — hardcoded, breaks dark mode, hard to maintain
className = "text-indigo-700 dark:text-indigo-400";

// Correct — semantic token, dark mode automatic
className = "text-income-net";
```

**2. Never use `bg-[var(--token)]` inline:**

```typescript
// Wrong
className = "bg-[var(--color-interactive-hover-bg)]";

// Correct — register in @theme inline first
className = "bg-interactive-hover";
```

**3. Never use opacity-based colors on sticky/fixed elements:**

```typescript
// Wrong — text bleeds through on scroll
className = "bg-amber-50/60 sticky left-0";

// Correct — solid token only
className = "bg-overdue-sticky sticky left-0";
```

**4. Never use inline HSL in utility classes:**

```css
/* Wrong */
.bg-item-card {
  background: hsl(222 45% 98%);
}

/* Correct — reference a token */
.bg-item-card {
  background: var(--color-surface-item-card);
}
```

**5. All accent/indigo usages must go through tokens:**

```typescript
// Wrong
"accent-indigo-600";
"text-indigo-600 dark:text-indigo-400";

// Correct
"accent-primary";
"text-income-net"; // or text-primary depending on context
```

**6. All danger/rose usages must go through tokens:**

```typescript
// Wrong
"text-rose-600 dark:text-rose-300";
"bg-rose-600 hover:bg-rose-700";

// Correct
"text-danger-fg";
"bg-danger-solid hover:bg-danger-solid/90";
```

**7. All status colors must go through tokens:**

```typescript
// Wrong
"bg-amber-50 text-amber-700 dark:bg-amber-500/10";
"bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10";

// Correct
"bg-warning text-warning";
"bg-status-success text-status-success-fg";
```

---

## shadcn/ui customization patterns

`/components/ui` files are copied from shadcn — they can be overwritten by
`npx shadcn add`. Two patterns for customizing them:

**Pattern 1 — CVA variant addition** (new semantic variants, keep shadcn structure):

- Add variants to the `cva()` call directly
- Extract custom variant values to `/lib/ui/variants.ts` — this file is never overwritten
- Spread into the CVA variants: `...alertCustomVariants`
- On shadcn upgrade: re-add the one-line spread import

**Pattern 2 — Full look-and-feel rewrite** (different visual design, same Radix behavior):

- Rewrite the file entirely, keep only the Radix primitive import
- You now own the file — shadcn upgrades don't apply
- Track Radix changelog for behavior changes, not shadcn
- Document rewrites in this file so the team knows

**Currently rewritten (own these files, ignore shadcn upgrades):**

- `tabs.tsx` — full rewrite, uses `@radix-ui/react-tabs` directly
- `toggle-group.tsx` — full rewrite

**Currently using CVA variants (re-apply spread on upgrade):**

- `alert.tsx` — custom `info` and `warning` variants

**Adding new components:**

- Install Radix directly: `npm install @radix-ui/react-[component]`
- Create `/components/ui/[component].tsx` with your own styles
- Do not rely on shadcn for look-and-feel — only for behavior reference

---

## Shared component classes (`@layer components`)

Do not repeat these class combinations inline — use the shared class:

| Class                  | Usage                              |
| ---------------------- | ---------------------------------- |
| `.table-sort-btn`      | Sort header buttons in LadderTable |
| `.action-menu-btn`     | Kebab menu trigger buttons         |
| `.danger-ghost-btn`    | Destructive ghost buttons (Delete) |
| `.status-pill`         | Base pill styles                   |
| `.status-pill-neutral` | Days to Maturity — normal state    |
| `.status-pill-overdue` | Days to Maturity — overdue state   |

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

**Product:**

- Do not add gross values to dashboard, timeline, or cash flow views
- Do not auto-settle investments — only the user can trigger settlement
- Do not add tooltips to dashboard cards — fix the label instead
- Do not show principal return as income anywhere
- Do not skip wizard steps programmatically
- Do not close the wizard dialog on outside click — data loss risk

**Storage:**

- Do not add direct `localStorage` calls — use `useLocalStorage`
- Do not add inline `Intl.NumberFormat` — use `formatPhpCurrency`

**Styling — never do these:**

- Do not hardcode palette classes for semantic meaning (`text-indigo-700`, `bg-rose-600`)
- Do not use `bg-[var(--token)]` inline — register in `@theme inline` first
- Do not use opacity-based colors on sticky or fixed positioned elements
- Do not use inline HSL values in `@layer utilities` — reference a CSS variable
- Do not use `accent-indigo-600` — use `accent-primary`
- Do not add new amber/emerald/rose/indigo classes — check token reference first
- Do not add a new utility class without a corresponding CSS variable in `:root` and `.dark`
- Do not modify shadcn files for look-and-feel — rewrite them or use CVA variants
