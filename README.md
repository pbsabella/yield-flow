# YieldFlow

A privacy‑first Yield Ladder & Liquidity Tracker for staggered time deposits and passive income planning.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Radix
- Lucide icons
- date-fns

## Local Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:a11y
npm run format
```

## Testing

- Unit: Vitest
- E2E: Playwright
- A11y: axe via Playwright
- Visual: Percy (optional)

## Percy

Set `PERCY_TOKEN` and run:

```bash
npm run test:percy
```

## Data Privacy

All data is stored locally in your browser. No servers, no tracking.
