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

## Date Handling

All date values in YieldFlow are **local calendar dates** (YYYY-MM-DD strings).
They represent a day in the user's local timezone — not a UTC timestamp.

### Three primitives — always use these, nothing else:

| Need                                      | Use                                          |
| ----------------------------------------- | -------------------------------------------- |
| Convert `Date` → YYYY-MM-DD string        | `toISODate(date)` from `lib/domain/date`     |
| Parse a stored YYYY-MM-DD string → `Date` | `parseLocalDate(str)` from `lib/domain/date` |
| Today as YYYY-MM-DD string                | `toISODate(new Date())`                      |

### Also available (use from `lib/domain/date`, never roll your own):

- `addTermMonths(date, n)` — month-aware addition respecting end-of-month
- `addDays(date, n)` — calendar-day addition
- `differenceInCalendarDays(a, b)` — day delta, local-safe

### Never:

- `date.toISOString().split("T")[0]` — UTC-based; drifts 1 day early in UTC+ timezones
- `new Date(isoDateString)` for stored dates — the JS spec parses date-only strings as UTC midnight
- Add a `timeZone` parameter to domain functions — the user's local timezone is always implied

---

## Tailwind v4 Token System

```
:root / .dark  →  @theme inline  →  CVA / className
```

No `tailwind.config.ts` for colors. No `@layer utilities` for color tokens.
`@theme inline` generates Tailwind classes automatically.

**Token naming:** `--color-{role}-{variant}-{property}`

**To add a token:** Add to `:root` + `.dark` → expose in `@theme inline` → use generated class.

**Always prefer semantic tokens over raw Tailwind utilities:**

- Spacing: `gap-stack-xs/sm/md/lg/xl`, `space-y-stack-*`, `px-card-x`, `py-card-y`, `py-stack-*` instead of `gap-2`, `space-y-4`, `px-4`, etc.
- Colors: `text-accent-fg`, `text-status-*-fg`, `bg-status-*-bg`, etc. instead of `text-primary dark:text-primary-subtle`, palette classes, or hardcoded values

**Never:**

- Hardcode palette classes (`text-indigo-700`, `bg-amber-50`)
- Use raw Tailwind spacing (`gap-2`, `px-4`, `space-y-6`) when a matching semantic token exists
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

## Testing

Every new feature or page requires coverage across all three layers:

| Layer | Tool | Location | When to write |
| ----- | ---- | -------- | ------------- |
| **Unit / integration** | Vitest + React Testing Library | `src/**/__tests__/` | Domain logic, hooks, complex components with branching render paths |
| **E2E flow** | Playwright | `tests/flows/` | Full user flows (add, edit, delete, close, import, export) |
| **A11y** | axe-core + Playwright | `tests/a11y/basic.a11y.spec.ts` | Every new page and every new dialog/menu that opens |

**A11y test rules:**

- Scope `AxeBuilder` to the component under test (`include('[role="dialog"]')`, `include('[role="menu"]')`) when a popup hides background elements via `aria-hidden`. Analyzing the full page while a modal/dropdown is open produces false positives for `aria-hidden-focus` on background focusable elements.
- Decorative containers already marked `aria-hidden="true"` are not excluded automatically by axe for color-contrast; scope the analysis or use `.exclude()` to avoid flagging them.
- Filter violations to `critical` and `serious` impact only (`v.impact === "critical" || v.impact === "serious"`).

**E2E test rules:**

- Cross-page tests (navigate from page A → action → navigate to page B → assert) are fragile due to the React state → `useLocalStorage` effect → page reload hydration chain. Prefer asserting the result on the same page, or split into independent tests.
- Avoid `{ exact: true }` on `getByText` when the text is unique in its visual context. Use a scoped locator instead (e.g. `page.getByRole("row").filter({ hasText: "..." }).getByText("Closed")`).
- Freeze time with `page.clock.setFixedTime` before `page.addInitScript` and `page.goto` so it applies to the initial load. The clock persists within the same Playwright browser context.

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
- Use `date.toISOString()` for local date storage — always use `toISODate()`
