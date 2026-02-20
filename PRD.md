# YieldFlow PRD (Product + Tech)

## 1. Overview
**Product:** YieldFlow — a mobile-first dashboard to visualize and manage monthly cash flow from staggered investments (T-Bills, CDs, dividends, TDs).

**Problem Statement**
How might we automate tiered interest calculations and visualize maturity schedules so users can manage liquidity with less manual work and better clarity?

**Target Users**
- Passive income trackers who currently rely on spreadsheets
- Users with multiple time deposits across multiple banks
- Users who need a clear view of maturity timing and monthly payouts

**Primary Value**
- Reduce manual spreadsheet work
- Provide real-time, visual feedback for cash flow and maturities
- Enable quick re-investment planning

## 2. Goals & Non‑Goals
**Goals (MVP)**
- Add and manage multiple time deposits per bank
- Calculate gross and net interest using fixed 20% tax
- Visualize maturities in a chronological timeline
- Show monthly gross/net payouts grouped by calendar month
- Provide mobile-first responsive UI
- Support dark/light mode (modern fintech brand)

**Non‑Goals (MVP)**
- External bank integrations
- Server-side persistence or authentication
- Multi-currency support
- Advanced tax rules beyond a fixed 20%

## 3. Success Metrics
- Time to add a deposit: under 60 seconds
- Maturity clarity: user can identify next maturity within 5 seconds
- Dashboard comprehension: user can explain monthly allowance within 30 seconds

## 4. User Stories
- As a user, I can add a time deposit for a bank and immediately see gross and net interest.
- As a user, I can see a timeline of maturities to plan rollovers.
- As a user, I can view monthly aggregated payouts (gross/net).
- As a user, I can toggle between light and dark themes.
- As a user, I can manage multiple deposits under a single bank.

## 5. Functional Requirements
### Core
- Create/Edit/Delete bank
- Create/Edit/Delete time deposit (TD)
- TD fields: bank, principal, start date, term, rate tiers, payout frequency, notes
- Calculate gross interest and net interest (gross - 20%)
- Maturity date calculation

### UI/UX
- **Dashboard**: summary + timeline + monthly allowance
- **Timeline view**: ordered by maturity date
- **Monthly allowance**: grouped by calendar month, gross and net
- **Add TD**: dialog with live calculation feedback
- **Responsive layout**: table on desktop, cards on mobile
- **Theme toggle**: top-right

### Data Rules
- Banks can have multiple TDs with varying or same tenure.
- Tiered interest logic must support marginal rate calculation (e.g., 0–1M at 3.25%, >1M at 3.75%).
- Tax: fixed 20% on interest (not principal).

## 6. UX Information Architecture
- `/` Dashboard
- `/banks` Bank list + bank detail
- `/deposits/:id` Deposit detail
- `/settings` Theme + data utilities (future persistence)

## 7. Technical Requirements (Tech Lead)
**Stack**
- Next.js (App Router)
- React
- shadcn/ui + Radix primitives
- CSS variables for theme tokens
- Local in-memory state for MVP; persistence deferred

**Architecture**
- `app/` route structure
- `components/` UI and layout
- `lib/domain/` business logic (interest calc, maturity, monthly aggregation)
- `lib/types/` type definitions
- `lib/state/` app state and hooks

**Theme System**
- CSS variables in `globals.css`
- Two theme maps: light and dark
- `data-theme` or class toggle on `html`
- Theme toggle component in top-right

## 8. Data Model (Draft)
**Bank**
- id
- name
- notes

**TimeDeposit**
- id
- bankId
- principal
- startDate
- termMonths
- tiers[] (threshold, rate)
- payoutFrequency (monthly / maturity)
- grossInterest
- netInterest
- maturityDate

**CashflowEvent**
- id
- date
- amountGross
- amountNet
- type (interest, maturity)

## 9. Risks & Mitigations
- Calculation complexity confusion: provide inline explanation and preview breakdown
- User trust in math: show breakdown in details view
- Lack of persistence: clear “data is local” banner and plan for storage later

## 10. Release Phases
**Phase 1 (MVP)**
- Core dashboard + add TD + timeline + monthly allowance
- Gross/net display with fixed tax
- Dark/light theme

**Phase 2**
- Local persistence
- Rollover actions
- Export/import

**Phase 3**
- Advanced tax rules
- Multiple currencies
- Bank-specific templates
