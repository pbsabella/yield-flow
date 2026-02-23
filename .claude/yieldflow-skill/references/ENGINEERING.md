# YieldFlow — Engineering Reference

> How to build it. No product decisions here.
> For what to build: read PRODUCT.md.

---

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui + Radix UI · lucide-react
Storage: `useLocalStorage` · Calc: `lib/yield-engine.ts` · Templates: `lib/banks-config.ts`

---

## File Structure

```
/components
  /dashboard     — Dashboard components
  /ui            — shadcn base or full rewrites
/lib
  /domain        — format.ts, date.ts, interest.ts
  /state         — useLocalStorage.ts
  types.ts · yield-engine.ts · banks-config.ts · demo.ts
```

---

## Component Architecture

| Component               | Responsibility                 |
| ----------------------- | ------------------------------ |
| `DashboardClient`       | Orchestration only             |
| `usePortfolioData`      | Data, persistence, summaries   |
| `useDepositDialogState` | Dialog open/close, edit target |
| `useImportExport`       | Backup, JSON import            |
| `WizardShell`           | Step state machine             |
| `Step1BankProduct`      | Bank + product selection       |
| `Step2Details`          | Investment fields              |
| `Step3Review`           | Read-only confirm              |
| `LiveCalcPreview`       | Debounced calc panel           |
| `LadderTable`           | Timeline table + mobile cards  |
| `MonthlyFlow`           | Cash flow by month             |

Oversized (refactor in progress): `DepositFormDialog.tsx` → wizard · `DashboardClient.tsx` → hooks

---

## Storage

`useLocalStorage` only. No direct `localStorage` calls.
`persistDeposits` = single helper on top of the hook.

---

## Formatting

`formatPhpCurrency(value: number): string` from `lib/domain/format.ts`
Never add inline `Intl.NumberFormat`.

---

## Tailwind v4 Token System

```
:root / .dark  →  @theme inline  →  CVA / className
```

No `tailwind.config.ts` for colors. No `@layer utilities` for color tokens.
`@theme inline` generates Tailwind classes automatically.

**Token naming:** `--color-{role}-{variant}-{property}`

**To add a token:** Add to `:root` + `.dark` → expose in `@theme inline` → use generated class.

**Never:**

- Hardcode palette classes (`text-indigo-700`, `bg-amber-50`)
- Use `bg-[var(--token)]` inline — register in `@theme inline` first
- Use inline HSL in any class — reference a CSS variable
- Add a variable to `:root` without adding to `.dark`
- Use `accent-indigo-*` — use `accent-primary`

**Text utilities (do not remap):**
`text-foreground` body · `text-primary` brand indigo · `text-muted-foreground` secondary

---

## shadcn/ui

**CVA variant addition:** extract to `lib/ui/variants.ts`, spread into `cva()`. Re-add spread on upgrade.
**Full rewrite:** keep only Radix import, own the file, track Radix changelog.

Rewritten: `tabs.tsx`, `toggle-group.tsx` · CVA variants: `alert.tsx`
New components: `npm install @radix-ui/react-[component]`

---

## External Skills

**`frontend-design`** — aesthetic direction only. Always constrain:

> "Use existing token system only. Financial, refined, minimal tone."

Priority chain: Domain Rules → Engineering Tokens → External Skill suggestions

---

## Performance

- `useMemo` on all sorted/filtered arrays
- Wizard steps render lazily — current step only
- LiveCalcPreview debounced 300ms
- Field-level dirty tracking in wizard, not `JSON.stringify`

---

## Known Bugs

- **Border color:** `border-b` overrides global reset. Fix: `border-color: hsl(var(--border))` on `*, *::before, *::after`
- **Scroll border:** frozen column border only when `scrollLeft > 0` — listen to `scroll` not `resize`
- **"Due today":** `formatDaysToMaturity` in `LadderTable` — 0 days → amber "Due today"
- **localStorage:** `DashboardClient` still uses direct calls — do not add more

---

## What NOT to Do

- Show gross values in any primary view
- Auto-settle investments
- Add tooltips — fix the label
- Skip wizard steps or close on outside click
- Direct `localStorage` calls
- Inline `Intl.NumberFormat`
- Hardcode palette classes
- Duplicate yield calc logic outside `yield-engine.ts`
- Modify shadcn files for look-and-feel — rewrite or CVA
