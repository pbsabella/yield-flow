# YieldFlow — Agent Guidelines

YieldFlow is a net-only, local-first yield ladder tracker (Next.js App Router, TypeScript, Tailwind CSS v4). It is **not** a backend app: no accounts, no server, no gross-value display. Data lives in browser storage. On any conflict, AGENTS.md wins.

## Docs (load via the `yieldflow` skill)

- `.claude/skills/yieldflow/references/ENGINEERING.md` — read before writing code or tokens
- `.claude/skills/yieldflow/references/PRODUCT.md` — read before UI, features, or product decisions

## Hard rules

- **Dates:** local YYYY-MM-DD strings. Use `toISODate()` / `parseLocalDate()` from `lib/domain/date`. Never `date.toISOString().split("T")[0]` (UTC drift) or `new Date("YYYY-MM-DD")` for stored dates (UTC-midnight parsing).
- **Currency:** `formatCurrency(value, currency)` from `lib/domain/format.ts` only. Use `getLocaleCurrency()` / `SUPPORTED_CURRENCIES` for the picker. Display-only — never convert. Never inline `Intl.NumberFormat`.
- **Storage:** `useLocalStorage` only. Never direct `localStorage` calls.
- **Yield calc:** core math in `lib/domain/yield-engine.ts`. Summaries are built by delegating modules (`interest.ts`, `accrued-interest.ts`, `renew.ts`, `cashflow.ts`, `ai-context.ts`). Never duplicate or fork the math.
- **Tokens:** semantic `@theme inline` tokens only. Never hardcode palette classes (`text-indigo-700`), raw spacing (`gap-2`), or `bg-[var(--token)]`. Add tokens to `:root` AND `.dark`.
- **shadcn/ui:** new components via `npx shadcn@latest add`. Never modify shadcn files for look-and-feel — extract CVA variants to `components/ui/variants.ts`.
- **Testing:** every feature/page needs unit/integration (Vitest + RTL in `src/**/__tests__/`), E2E (Playwright in `tests/flows/`), and a11y (axe in `tests/a11y/basic.a11y.spec.ts`).

## Commands

- `npm run lint` — ESLint + typecheck
- `npm run test` — unit/integration
- `npm run test:all` — unit + E2E + a11y
- `npm run build` — production build
- `npm run test:e2e` / `npm run test:a11y` — Playwright (auto-installs browsers via `pretest:e2e`); `npx playwright test <spec>` for a single spec
