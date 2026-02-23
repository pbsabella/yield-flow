---
name: yieldflow
description: YieldFlow is a yield ladder tracker app. Use this skill when working on the YieldFlow codebase, designing features, reviewing code, writing prompts, or making product decisions for YieldFlow. Triggers on: "work on YieldFlow", "YieldFlow feature", "YieldFlow bug", "update the app", "add investment", "ladder table", "cash flow", "deposit form", "dashboard", "seed data", "banks config", "yield engine".
metadata:
  author: YieldFlow
  version: 1.0.0
  category: finance, personal-project, portfolio
---

# YieldFlow — AI Engineering Skill

> Read `references/PRODUCT.md` for product decisions and UX flows.
> Read `references/ENGINEERING.md` for engineering conventions and token rules.
> This file is orientation only — those files are the source of truth.

---

## Purpose

YieldFlow is a yield ladder tracker for savers who spread money across
multiple bank products — time deposits, savings accounts, and digital bank
offerings. It eliminates the spreadsheet most people use to track maturity
dates, net interest after tax, and cash flow timing. It tells you what
you're actually earning, when money is coming back, and whether you're
overexposed at any single institution.

**Primary users:** Savers in any market with high-yield bank products who
manage 3+ accounts simultaneously and need visibility across all of them.

**Portfolio context:** This project doubles as a portfolio piece demonstrating
product thinking, UX decisions with rationale, technical architecture, and
domain modeling. Code quality and documentation matter as much as features.

---

## Core Use Cases

### Use Case 1 — Yield Ladder Visibility

**Trigger:** User wants to see all investments in one place
**What YieldFlow does:**

1. Shows all active investments in a timeline sorted by maturity date
2. Calculates net interest after withholding tax for each
3. Flags overdue (matured but not settled) investments in amber
4. Shows days to maturity as a badge on each row

**Success:** User knows at a glance what's maturing, what's overdue, and
what's earning without opening a spreadsheet

### Use Case 2 — Cash Flow Projection

**Trigger:** User wants to know when money is coming in
**What YieldFlow does:**

1. Groups expected payouts by month
2. Separates recurring monthly interest from lump-sum maturity payouts
3. Shows net amounts only — never gross
4. Distinguishes pending vs settled payouts

**Success:** User can plan spending around incoming cash without manual math

### Use Case 3 — Smart Investment Capture

**Trigger:** User adds a new bank product to their portfolio
**What YieldFlow does:**

1. Guides user through a 3-step wizard — Bank & Product → Details → Review
2. Pre-fills rates and conventions from bank templates
3. Calculates live net interest preview as user types
4. Warns if deposit insurance limit is approached at any single bank

**Success:** User adds an investment in under 2 minutes without knowing the
bank's calculation model or withholding tax rules

---

## Success Criteria

### Functional

- [ ] Net interest matches manual calculation within ±1 peso
- [ ] Maturity dates correct regardless of term input mode
- [ ] Overdue investments always show in amber — never missed
- [ ] Settled investments excluded from Total Principal
- [ ] Deposit insurance warning fires before limit is crossed

### UX

- [ ] Wizard completable in under 2 minutes
- [ ] No financial terminology user needs to look up
- [ ] Mobile and desktop both fully functional
- [ ] Dark and light mode both polished

### Code quality (portfolio standard)

- [ ] No hardcoded palette classes — all colors via semantic tokens
- [ ] No inline localStorage calls — all via useLocalStorage
- [ ] No inline Intl.NumberFormat — all via formatPhpCurrency
- [ ] All sorted/filtered arrays wrapped in useMemo

---

## Active Work Streams

In priority order:

1. **Design system rewrite** — drop utility layer, pure @theme inline tokens
2. **Pass 2 refactor** — formatPhpCurrency, useLocalStorage, memoize sort, persistDeposits, "Due today" badge
3. **Add Investment Wizard** — replace DepositFormDialog.tsx entirely per PRODUCT.md spec
4. **DashboardClient hook split** — after wizard stable: useImportExport → useDepositDialogState → usePortfolioData

---

## Key Files

| File                           | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `references/PRODUCT.md`        | Product decisions, UX flows, feature specs    |
| `references/ENGINEERING.md`    | Engineering conventions, tokens, architecture |
| `globals.css`                  | CSS variables and @theme inline tokens        |
| `lib/yield-engine.ts`          | Interest calculation — do not duplicate       |
| `lib/banks-config.ts`          | Bank/product templates — rates, conventions   |
| `lib/domain/format.ts`         | formatPhpCurrency — single source             |
| `lib/domain/date.ts`           | Date utilities                                |
| `lib/state/useLocalStorage.ts` | Primary storage abstraction                   |
