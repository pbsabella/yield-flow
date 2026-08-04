# YieldFlow — Agent Guidelines

Guidance for AI agents working in this repo. The full engineering spec lives in `.claude/skills/yieldflow-skill/references/ENGINEERING.md`; PRODUCT.md covers product intent. When in doubt, defer to those.

## Stack

Next.js App Router · TypeScript · Tailwind CSS v4 · shadcn/ui + Radix UI · Zustand · Vitest/Playwright. Storage: `useLocalStorage` hook only — no direct `localStorage` calls.

## Non-negotiables

- **Dates:** Stored dates are local YYYY-MM-DD strings. Use `toISODate()` / `parseLocalDate()` from `lib/domain/date`. Never `toISOString().split("T")[0]` or `new Date("YYYY-MM-DD")` for storage (UTC drift / UTC-midnight parsing).
- **Currency:** `formatPhpCurrency()` from `lib/domain/format.ts` only. No inline `Intl.NumberFormat`.
- **Yield logic:** All calculations live in `lib/domain/yield-engine.ts`. Do not duplicate.
- **Tokens:** Use the Tailwind `@theme inline` semantic token system — never hardcode palette classes, raw spacing (`gap-2`), or `bg-[var(--token)]`. Add to `:root` AND `.dark`.
- **shadcn:** New components via `npx shadcn@latest add`. Don't modify shadcn files for look-and-feel — extract CVA variants to `components/ui/variants.ts`.

## Testing

Every feature/page needs coverage across all three layers:

| Layer | Tool | Location |
| ----- | ---- | -------- |
| Unit/integration | Vitest + RTL | `src/**/__tests__/` |
| E2E flows | Playwright | `tests/flows/` |
| A11y | axe + Playwright | `tests/a11y/basic.a11y.spec.ts` |

A11y: scope `AxeBuilder` to the component under test (modals/menus hide background via `aria-hidden`); filter to `critical`/`serious` impact. E2E: prefer same-page assertions over cross-page chains; freeze time with `page.clock.setFixedTime` before `page.addInitScript` and `page.goto`.

## Commands

- `npm run lint` — ESLint + typecheck
- `npm run test` — unit/integration
- `npm run build` — production build
- `npx playwright test` — E2E/a11y (needs `npx playwright install chromium` first)
