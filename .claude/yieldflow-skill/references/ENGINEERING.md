# YieldFlow — Engineering Reference

> How to build it. No product decisions here.
> For what to build: read PRODUCT.md.

---

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui + Radix UI · lucide-react
Storage: `useLocalStorage` · Calc: `lib/domain/yield-engine.ts` · Templates: `lib/data/banks-config.ts`

---

## Storage

`useLocalStorage` only. No direct `localStorage` calls.
`usePersistedDeposits` = single helper on top of the hook.
`usePortfolioData` synthesizes a `Bank` object when `bankMap.get(deposit.bankId)` misses — supports free-text bank names.

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

**Text utilities (do not remap):**
`text-foreground` body · `text-primary` brand indigo · `text-muted-foreground` secondary

---

## shadcn/ui

**CVA variant addition:** extract to `components/ui/variants.ts`, spread into `cva()`. Re-add spread on upgrade.

New components: `npx shadcn@latest add [component]`

---

## External Skills

**`frontend-design`** — aesthetic direction only. Always constrain:

> "Use existing token system only. Financial, refined, minimal tone."

Priority chain: Domain Rules → Engineering Tokens → External Skill suggestions

---

## Performance

- `useMemo` on all sorted/filtered arrays
- LiveCalcPreview debounced 300ms
- Snapshot-based dirty tracking in wizard: `JSON.stringify(formState) !== JSON.stringify(initialState)`; `initialState` set on open/load so edit mode starts clean

---

## Accessibility

**WCAG AA minimum for all text:** 4.5:1 normal text, 3:1 large text and UI components.

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
- Add a token to `:root` without a matching entry in `.dark`
