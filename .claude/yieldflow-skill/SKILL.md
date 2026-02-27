---
name: yieldflow-skill
description: YieldFlow is a yield ladder tracker app. Use this skill when working on the YieldFlow codebase, designing features, reviewing code, writing prompts, or making product decisions for YieldFlow. Triggers on: "work on YieldFlow", "YieldFlow feature", "YieldFlow bug", "add investment", "ladder table", "cash flow", "deposit form", "dashboard", "seed data", "yield engine".
metadata:
  author: YieldFlow
  version: 1.1.0
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

**Yield Ladder Visibility** — sort ASC, amber overdue badges
**Cash Flow Projection** — group by month, net interest only, pending/settled pills
**Smart Investment Capture** — single-step dialog, free-text bank, live calc preview, edit mode

---

## Success Criteria

- Net interest matches manual calc within ±1 peso
- Overdue investments always amber — never missed
- Wizard completable in under 2 minutes
- No hardcoded palette classes, no inline localStorage, no inline Intl.NumberFormat

---

## Key Files

| File                                      | Purpose                          |
| ----------------------------------------- | -------------------------------- |
| `references/PRODUCT.md`                   | What to build and why            |
| `references/ENGINEERING.md`               | How to build it                  |
| `src/app/globals.css`                     | Token source of truth            |
| `src/lib/domain/yield-engine.ts`          | Interest calc — do not duplicate |
| `src/lib/domain/format.ts`                | formatPhpCurrency                |
| `src/lib/hooks/useLocalStorage.ts`        | Storage abstraction              |
| `src/features/dashboard/hooks/useWizardState.ts` | Wizard form state + validation   |
