# YieldFlow — Engineering Reference

> How to build YieldFlow. No product decisions here.
> For what to build and why: read `PRODUCT.md`.
> Update this file after any major refactor or architectural decision.

---

## Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + CSS variables in `globals.css`
- **UI primitives:** shadcn/ui + Radix UI (some components fully rewritten)
- **Icons:** lucide-react
- **Storage:** localStorage via `useLocalStorage` hook
- **Yield calculations:** `lib/yield-engine.ts`
- **Bank templates:** `lib/banks-config.ts`

---

## File Structure

```
/app                         — Next.js app router pages
/components
  /dashboard                 — Dashboard-level components
  /ui                        — UI primitives (shadcn base or full rewrites)
/lib
  /domain                    — Pure domain functions
    format.ts                — formatPhpCurrency
    date.ts                  — Date utilities
    interest.ts              — buildDepositSummary
  /state
    useLocalStorage.ts       — Primary storage abstraction
  /types.ts                  — All shared TypeScript types
  /yield-engine.ts           — Interest calculation engine
  /banks-config.ts           — Bank/product templates
  /demo.ts                   — Seed data (relative dates)
```

---

## Component Architecture

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

**Known oversized files (refactor in progress):**

- `DepositFormDialog.tsx` — being replaced entirely by wizard components
- `DashboardClient.tsx` — being split into hooks above

---

## Storage

`useLocalStorage` is the only permitted storage abstraction.
Direct `localStorage` calls are an anti-pattern — do not add more.

```typescript
// Correct
const [deposits, setDeposits] = useLocalStorage<TimeDeposit[]>("deposits", []);

// Wrong — do not add
localStorage.setItem("deposits", JSON.stringify(deposits));
```

`persistDeposits` should be a single helper built on `useLocalStorage`.

---

## Formatting

All currency formatting goes through `lib/domain/format.ts`:

```typescript
formatPhpCurrency(value: number): string
```

Never add inline `Intl.NumberFormat` calls in components.

---

## Tailwind v4 — Token System

No `tailwind.config.ts` for colors. All theme config lives in `globals.css`.

**Token chain:**

```
:root / .dark       — raw HSL values, source of truth
      ↓
@theme inline       — exposes tokens as Tailwind utility classes
      ↓
CVA / className     — consumed directly in components
```

No separate `@layer utilities` for color tokens. Tailwind generates utility
classes from `@theme inline` automatically. Co-location preserved.

**To add a new token:**

1. Add raw HSL value to `:root` and `.dark`
2. Expose in `@theme inline`
3. Use the generated class in components

**Token naming:**

```
--color-{role}-{variant}-{property}
```

---

## Token Rules — Never Break These

**Never hardcode palette classes:**

```typescript
// Wrong
"text-indigo-700 dark:text-indigo-400";
"bg-amber-50 dark:bg-amber-500/10";

// Correct — use generated token class
"text-income-net-fg";
"bg-status-warning-bg";
```

**Never use inline var():**

```typescript
// Wrong
"bg-[var(--color-interactive-hover-bg)]";

// Correct — register in @theme inline first
"bg-interactive-hover";
```

**Never use inline HSL:**

```css
/* Wrong */
.my-class {
  background: hsl(243 60% 97%);
}

/* Correct */
.my-class {
  background: var(--color-status-info-bg);
}
```

**Never use accent-indigo-\*:**

```typescript
// Wrong
"accent-indigo-600";

// Correct
"accent-primary";
```

**Text utility meaning (do not remap):**

- `text-foreground` — body text
- `text-primary` — brand indigo (`--primary`)
- `text-muted-foreground` — secondary/muted text

---

## shadcn/ui Customization

`/components/ui` files are shadcn copies — overwritten by `npx shadcn add`.

**Pattern 1 — CVA variant addition:**

- Add to `cva()` variants
- Extract values to `lib/ui/variants.ts` — never overwritten
- Spread into CVA: `...myCustomVariants`
- On upgrade: re-add the one-line spread import

**Pattern 2 — Full rewrite:**

- Rewrite file entirely, keep only the Radix primitive import
- You own it — track Radix changelog, not shadcn
- Install Radix directly: `npm install @radix-ui/react-[component]`

**Currently rewritten:** `tabs.tsx`, `toggle-group.tsx`
**Currently using CVA variants:** `alert.tsx`

---

## Performance Rules

- Wrap sorted/filtered arrays in `useMemo` — especially `LadderTable` sort
- Wizard step components render lazily — only current step renders
- Debounce live calculation preview at 300ms
- Use field-level dirty tracking in wizard — not `JSON.stringify` comparison
- Precompute `monthlyEntries` and `maturityEntries` once per `MonthlyFlow` item

---

## Known Bugs / Gotchas

- **Border color override:** `border-b` overrides `border-border` global reset.
  Fix: use `border-color: hsl(var(--border))` on `*, *::before, *::after`
  instead of `@apply border-border` to set all four sides including directional variants.
- **Horizontal scroll border:** frozen column border should only appear when
  `scrollLeft > 0`. Listen to `scroll` event, not just `resize`.
- **"Due today" badge:** investments maturing today show "Due today" in amber,
  not "0 days" neutral. Check `formatDaysToMaturity` in `LadderTable`.
- **useLocalStorage unused:** `DashboardClient` still uses direct localStorage
  calls. Do not add more — adopt the hook.

---

## External Skills & Orchestration

Use external skills as specialized "filters" for craft quality. When invoking them, you must maintain the **YieldFlow Priority Chain**:
`Domain Rules > Engineering Tokens > External Skill Suggestions`.

### 1. UI Implementation (`frontend-design`)

**Purpose:** Push aesthetic quality (spacing, visual hierarchy, layout) beyond generic AI output.
**Protocol:**

- **Constraint:** NEVER introduce new hex codes, HSL values, or Tailwind palette classes (e.g., `bg-blue-500`).
- **Mapping:** Map all design suggestions to the `@theme inline` tokens in `globals.css`.
- **Tone:** Financial, refined, minimal. Avoid rounded-full corners or playful animations.

### 2. Build guides (`web-interface-guidelines`)

**Purpose:** Ensure technical accessibility and semantic HTML standards.
**Protocol:**

- **Focus:** Use for complex component patterns (e.g., ARIA live regions for the LiveCalcPreview).
- **Standard:** Must pass WCAG 2.1 AA contrast and keyboard navigation tests.

### 3. Feature Logic (`ux-heuristics`)

**Purpose:** Audit flows for cognitive load and "burden of terminology."
**Protocol:**

- **Validation:** Check all input labels against the "Non-Expert" rule in `PRODUCT.md`.
- **Friction Check:** Flag any step in the Wizard that requires the user to perform manual math (e.g., calculating net from gross).

### Prompt Orchestration Pattern

When using these skills, structure your internal reasoning as follows:

1. **Load YieldFlow**: Establish domain logic (Net only, Status machine).
2. **Apply Design**: Determine layout and spacing.
3. **Tokenize**: Convert design intent into YieldFlow semantic tokens.
4. **Audit UX**: Verify the final copy and flow against heuristics.

---

## What NOT to Do

**Product (see PRODUCT.md for reasoning):**

- Do not show gross values anywhere in primary views
- Do not auto-settle investments
- Do not add tooltips to dashboard cards — fix the label
- Do not show principal return as income
- Do not skip wizard steps programmatically
- Do not close wizard on outside click

**Engineering:**

- Do not add direct `localStorage` calls — use `useLocalStorage`
- Do not add inline `Intl.NumberFormat` — use `formatPhpCurrency`
- Do not hardcode palette classes — use token classes
- Do not use `bg-[var(--token)]` inline — register in `@theme inline` first
- Do not add new amber/emerald/rose/indigo classes — check tokens first
- Do not add a CSS variable without adding it to both `:root` and `.dark`
  (exception: `--color-gradient-teal` is intentionally dark-mode only)
- Do not modify shadcn files for look-and-feel — rewrite or use CVA variants
- Do not duplicate yield calculation logic outside `yield-engine.ts`
