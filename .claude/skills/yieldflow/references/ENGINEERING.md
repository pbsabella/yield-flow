# YieldFlow — Engineering Reference

> How to build it. No product decisions here.
> For what to build: read PRODUCT.md.

---

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui + Radix UI · lucide-react
Storage: `useLocalStorage` (via `usePersistedDeposits` / `usePreferences`) · Calc: `lib/domain/yield-engine.ts` + delegating modules · Wizard state: `store/wizardStore.ts`

---

## Yield Calculation

Core math lives in `lib/domain/yield-engine.ts` (`calculateNetYield`). Never duplicate or fork it. Summaries are built by delegating modules, all of which route through the engine:

| Module | Export | Builds |
| ------ | ------ | ------ |
| `lib/domain/interest.ts` | `buildDepositSummary` | Per-deposit summary (status, days, net interest) |
| `lib/domain/accrued-interest.ts` | `calculateAccruedToDate` | Accrued interest up to a date (pro-rated by `termDays = daysHeld`) |
| `lib/domain/rollover.ts` | `getRolloverPrincipal` | Rollover principal (principal + net total) |
| `lib/domain/cashflow.ts` | `buildCashFlowProjection`, `buildCashFlowLedger`, `buildMonthlyAllowance` | Cash-flow tables, ledger entries, per-month allowance |
| `lib/domain/ai-context.ts` | `buildAiContext` | Prompt + tables for Export for AI |

Engine details worth preserving: day-count formula per `dayCountConvention`; `rate / dayCountConvention` (daily compounding) vs `rate / 12` (monthly); effective rate = `taxRateOverride ?? bank.taxRate`; open-ended deposits project `OPEN_ENDED_PROJECTION_MONTHS` (12) months forward.

---

## Storage

`useLocalStorage` only. No direct `localStorage` calls.
Helpers: `usePersistedDeposits` (deposits) and `usePreferences` (currency + insurance limit) on top of the hook.
`setValueSync` (on the hook) writes synchronously, bypassing the async persist effect — use it only when a write must survive an imminent unmount (e.g. `importPreferences` before navigation).

**BankId semantics:** a deposit's `bankId` is the free-text name typed by the user. When `bankMap.get(deposit.bankId)` misses, `usePortfolioData` synthesizes a `Bank` with `taxRate = taxRateOverride ?? 0.2`. The wizard always writes `taxRateOverride` on a deposit.

---

## Runtime Status (effectiveStatus)

`effectiveStatus` is derived at runtime by `usePortfolioData` (`src/features/portfolio/hooks/usePortfolioData.ts`) — it is **never stored**. Rules:

- `active` → `matured` once `maturityDate` passes (may be `overdue` in presentation, but "overdue" is not a status).
- `settled` and `closed` are terminal and stored.
- Re-checked every 60s (setInterval) and on each recompute.

It drives badges, grouping, ladder colors, cash-flow projection, and AI context. Never persist it or write it back to a deposit.

---

## Wizard State

Two pieces, do not conflate:

- `src/features/portfolio/hooks/useWizardState.ts` — form state + validation (dirty tracking via `JSON.stringify` snapshot).
- `src/store/wizardStore.ts` (zustand) — orchestration: `wizardOpen`, `editTarget`, `rolloverConfig`, `highlightedId` (auto-clears after 2.5s), `exportAiOpen`. `PortfolioContext` mutates it via `useWizardStore.getState()`.

---

## Formatting

`formatCurrency(value: number, currency: string)` from `lib/domain/format.ts` — the only formatter.
Multi-currency is display-only ("vanity"): numbers are stored and computed currency-free; the currency just changes formatting. Use `getLocaleCurrency()` (region → currency, SSR-safe, USD fallback) for the default, `SUPPORTED_CURRENCIES` (9 codes) for the picker, and `getCurrencySymbol()` for addons. Never convert.
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

**Token naming:** `--color-{role}-{variant}-{property}` (some tokens deviate — e.g. `--color-accent-fg`, `--color-input-bg`, `--color-table-frozen-bg`, `--color-banner-bg`; `--spacing-*` for spacing). Check `globals.css` before assuming a name.

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
- Duplicate or fork yield calc logic — always route through `yield-engine.ts` / the delegating modules
- Modify shadcn files for look-and-feel — rewrite or CVA
- Add a token to `:root` without a matching entry in `.dark`
- Use `date.toISOString()` for local date storage — always use `toISODate()`
