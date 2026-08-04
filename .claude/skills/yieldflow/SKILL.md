---
name: yieldflow
description: YieldFlow is a net-only, local-first yield ladder tracker. Use this skill for any work in the YieldFlow codebase — features, bugs, code review, UI design and tokens, yield-engine calculations, wizard and ladder/cash-flow pages, seed data, writing prompts, or product decisions.
metadata:
  author: YieldFlow
  version: 1.2.0
  category: finance, personal-project, portfolio
---

# YieldFlow

> Load references/ when the task needs it:
>
> - Building UI or features → read references/PRODUCT.md
> - Writing code or tokens → read references/ENGINEERING.md
> - Simple tasks → this file is enough

Portfolio-grade yield ladder tracker. Net-only display, local-first, no accounts.

## Key Files

| File                                             | Purpose                          |
| ------------------------------------------------ | -------------------------------- |
| `references/PRODUCT.md`                          | What to build and why            |
| `references/ENGINEERING.md`                      | How to build it                  |
| `src/app/globals.css`                            | Token source of truth            |
| `src/lib/domain/yield-engine.ts`                 | Interest calc — do not duplicate |
| `src/lib/domain/format.ts`                       | formatPhpCurrency                |
| `src/lib/hooks/useLocalStorage.ts`               | Storage abstraction              |
| `src/features/dashboard/hooks/useWizardState.ts` | Wizard form state + validation   |
