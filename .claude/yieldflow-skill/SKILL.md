---
name: yieldflow-skill
description: YieldFlow is a yield ladder tracker app. Use this skill when working on the YieldFlow codebase, designing features, reviewing code, writing prompts, or making product decisions for YieldFlow. Triggers on: "work on YieldFlow", "YieldFlow feature", "YieldFlow bug", "add investment", "ladder table", "cash flow", "deposit form", "dashboard", "seed data", "banks config", "yield engine".
metadata:
  author: YieldFlow
  version: 1.0.0
  category: finance, personal-project, portfolio
---

# YieldFlow

> Only load references/ when the task needs it:
>
> - Building UI or features → read references/PRODUCT.md
> - Writing code or tokens → read references/ENGINEERING.md
> - Simple tasks → this file is enough

Portfolio-grade yield ladder tracker. Net-only display, local-first, no accounts.

---

## Use Cases

**Yield Ladder Visibility** — sort ASC, amber overdue badges, tabular-nums
**Cash Flow Projection** — group by month, net interest only, pending/settled pills
**Smart Investment Capture** — 2-step wizard, pre-fill templates, live calc preview

---

## Success Criteria

- Net interest matches manual calc within ±1 peso
- Overdue investments always amber — never missed
- Wizard completable in under 2 minutes
- No hardcoded palette classes, no inline localStorage, no inline Intl.NumberFormat

---

## Active Work Streams

1. **Pass 2 refactor** — formatPhpCurrency, useLocalStorage, memoize sort, persistDeposits, "Due today" badge
2. **Add Investment Wizard** — replace DepositFormDialog.tsx per PRODUCT.md
3. **DashboardClient hook split** — after wizard: useImportExport → useDepositDialogState → usePortfolioData

---

## Key Files

| File                           | Purpose                          |
| ------------------------------ | -------------------------------- |
| `references/PRODUCT.md`        | What to build and why            |
| `references/ENGINEERING.md`    | How to build it                  |
| `globals.css`                  | Token source of truth            |
| `lib/yield-engine.ts`          | Interest calc — do not duplicate |
| `lib/banks-config.ts`          | Bank/product templates           |
| `lib/domain/format.ts`         | formatPhpCurrency                |
| `lib/state/useLocalStorage.ts` | Storage abstraction              |
