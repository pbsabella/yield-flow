---
name: yieldflow
description: YieldFlow is a net-only, local-first yield ladder tracker. Use this skill for any work in the YieldFlow codebase — features, bugs, code review, UI design and tokens, yield-engine calculations, wizard and ladder/cash-flow pages, seed data, writing prompts, or product decisions.
metadata:
  author: YieldFlow
  version: 1.3.0
  category: finance, personal-project, portfolio
---

# YieldFlow

> Load references/ when the task needs it:
>
> - Building UI or features → read references/PRODUCT.md
> - Writing code or tokens → read references/ENGINEERING.md
> - Weighing tradeoffs, writing prompts, or touching a contested feature → read references/DECISIONS.md
> - Simple tasks → this file is enough

Portfolio-grade yield ladder tracker. Net-only display, local-first, no accounts.

## Key Files

| File                                                         | Purpose                                       |
| ------------------------------------------------------------ | --------------------------------------------- |
| `references/PRODUCT.md`                                      | What to build and why                         |
| `references/ENGINEERING.md`                                  | How to build it                               |
| `references/DECISIONS.md`                                    | Why decisions were made (pruned ADR archive)  |
| `src/app/globals.css`                                        | Token source of truth                         |
| `src/lib/domain/yield-engine.ts`                             | Interest calc core — do not duplicate         |
| `src/lib/domain/interest.ts`, `cashflow.ts`, `ai-context.ts` | Delegating summary builders                   |
| `src/lib/domain/format.ts`                                   | formatCurrency (multi-currency)               |
| `src/lib/hooks/useLocalStorage.ts`                           | Storage abstraction                           |
| `src/store/wizardStore.ts`                                   | Wizard orchestration (zustand)                |
| `src/features/portfolio/hooks/useWizardState.ts`             | Wizard form state + validation                |
| `src/features/portfolio/hooks/usePortfolioData.ts`           | Runtime summary/`effectiveStatus` computation |
