# Design Token Consolidation — Pass 2

> Read `AI.md` and `globals.css` before starting.
> Execute in three separate commits in the order below.
> Do not change any layout, spacing, or behavior — styling only.

---

## Commit 1 — Add missing tokens

Add the following to `:root`, `.dark`, and `@theme inline` in `globals.css`.
Do not remove any existing tokens.

### Add to `:root`:

```css
/* Status — info (indigo tint) */
--color-status-info-bg: hsl(243 60% 97%);
--color-status-info-fg: hsl(243 60% 25%);
--color-status-info-border: hsl(243 40% 88%);

/* Status — success (emerald) */
--color-status-success-bg: hsl(142 60% 95%);
--color-status-success-fg: hsl(142 60% 25%);
--color-status-success-border: hsl(142 50% 82%);

/* Danger — solid (rose) */
--color-danger-bg: hsl(0 84% 50%);
--color-danger-border: hsl(0 84% 75%);

/* Interactive — selected border */
--color-interactive-selected-border: hsl(243 75% 70%);

/* Bank name */
--color-bank-name-fg: hsl(199 89% 35%);

/* Surface — item card */
--color-surface-item-card: hsl(222 45% 98%);
```

### Add to `.dark`:

```css
/* Status — info */
--color-status-info-bg: hsl(243 30% 15%);
--color-status-info-fg: hsl(243 60% 85%);
--color-status-info-border: hsl(243 25% 25%);

/* Status — success */
--color-status-success-bg: hsl(142 30% 12%);
--color-status-success-fg: hsl(142 60% 70%);
--color-status-success-border: hsl(142 30% 22%);

/* Danger — solid */
--color-danger-bg: hsl(0 72% 45%);
--color-danger-border: hsl(0 72% 40%);

/* Interactive — selected border */
--color-interactive-selected-border: hsl(239 84% 60%);

/* Bank name */
--color-bank-name-fg: hsl(199 89% 60%);

/* Surface — item card */
--color-surface-item-card: hsl(232 22% 16%);
```

### Add to `@theme inline`:

```css
/* Status — info */
--color-status-info: var(--color-status-info-bg);
--color-status-info-fg: var(--color-status-info-fg);
--color-status-info-border: var(--color-status-info-border);

/* Status — success */
--color-status-success: var(--color-status-success-bg);
--color-status-success-fg: var(--color-status-success-fg);
--color-status-success-border: var(--color-status-success-border);

/* Danger */
--color-danger-solid: var(--color-danger-bg);
--color-danger-border: var(--color-danger-border);

/* Interactive */
--color-interactive-selected-border: var(--color-interactive-selected-border);
--color-interactive-hover: var(--color-interactive-hover-bg);
--color-interactive-active: var(--color-interactive-active-bg);
--color-interactive-selected: var(--color-interactive-selected-bg);

/* Semantic */
--color-bank-name: var(--color-bank-name-fg);
--color-income-net: var(--color-income-net-fg);
--color-surface-item: var(--color-surface-item-card);
```

### Update `@layer utilities` — replace inline HSL with tokens:

```css
/* Replace existing .bg-item-card */
.bg-item-card {
  background: var(--color-surface-item-card);
}

/* Replace existing .bg-sample-banner */
.bg-sample-banner {
  background: var(--color-status-info-bg);
  border-color: var(--color-status-info-border);
}

/* Replace existing .bg-portfolio-surface */
/* Already maps to --color-surface-base — remove the dark variant
   and point both to the same token: */
.bg-portfolio-surface {
  background: var(--color-surface-base);
}
```

### Add typography token to `@theme inline`:

```css
--text-badge: 0.6875rem; /* 11px */
```

---

## Commit 2 — Replace existing token usages

Mechanical find and replace across the codebase.
Match exact class strings. Do not change any surrounding code.

### `accent-indigo-600` → `accent-primary`

Files: `DashboardClient.tsx`, `DepositFormDialog.tsx`
All instances.

### `text-rose-600 dark:text-rose-300` → `text-danger-fg`

Add `.text-danger-fg { color: var(--color-danger-fg); }` to `@layer utilities` if not present.
Files: `DashboardClient.tsx`, `DepositFormDialog.tsx`
All 14+ instances.

### `border-rose-600 dark:border-rose-400` → `border-danger-border`

Add `.border-danger-border { border-color: var(--color-danger-border); }` to `@layer utilities`.
Files: `DepositFormDialog.tsx` lines 1165, 1296.

### `text-sky-700 dark:text-sky-400` → `text-bank-name`

Add `.text-bank-name { color: var(--color-bank-name-fg); }` to `@layer utilities`.
Files: `LadderTable.tsx` lines 234, 383, `StatsGrid.tsx` line 62.

### `text-indigo-600 dark:text-indigo-400` and `text-indigo-700 dark:text-indigo-400` → `text-income-net`

Files: `DashboardClient.tsx`, `DepositFormDialog.tsx`.

### Amber warning classes → semantic tokens

```
bg-amber-50 text-amber-700 ring-amber-100
dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20
```

Replace with: `bg-status-warning text-status-warning-fg ring-status-warning-border`
Add ring utility to `@layer utilities`:

```css
.ring-status-warning-border {
  --tw-ring-color: var(--color-status-warning-border);
}
```

Files: `MonthlyFlow.tsx` line 77, `StatsGrid.tsx` line 40, `alert.tsx` line 14.

### Emerald success classes → semantic tokens

```
bg-emerald-50 text-emerald-700 ring-emerald-100
dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20
```

Replace with: `bg-status-success text-status-success-fg ring-status-success-border`
Add ring utility:

```css
.ring-status-success-border {
  --tw-ring-color: var(--color-status-success-border);
}
```

Files: `MonthlyFlow.tsx` line 82, `StatsGrid.tsx` line 45.

### Info/indigo tint classes → semantic tokens

```
border-indigo-300/60 bg-indigo-50/60
dark:border-indigo-500/30 dark:bg-indigo-500/10
```

Replace with: `bg-status-info border-status-info-border`
Add to `@layer utilities`:

```css
.bg-status-info {
  background: var(--color-status-info-bg);
}
.border-status-info {
  border-color: var(--color-status-info-border);
}
.text-status-info-fg {
  color: var(--color-status-info-fg);
}
.bg-status-success {
  background: var(--color-status-success-bg);
}
.text-status-success-fg {
  color: var(--color-status-success-fg);
}
```

Files: `DepositFormDialog.tsx` line 1671, `alert.tsx` line 12.

### Danger solid button classes → semantic

```
bg-rose-600 text-white dark:bg-rose-500
hover:bg-rose-700 active:bg-rose-800 dark:hover:bg-rose-400 dark:active:bg-rose-300
```

Replace with: `bg-danger-solid text-white hover:bg-danger-solid/90 active:bg-danger-solid/80`
Add to `@layer utilities`:

```css
.bg-danger-solid {
  background: var(--color-danger-bg);
}
```

Files: `DepositFormDialog.tsx` line 1755, `ConfirmDeleteDialog.tsx` line 34.

### `hover:bg-[var(...)]` arbitrary → Tailwind utility

```
hover:bg-[var(--color-interactive-hover-bg)]
active:bg-[var(--color-interactive-active-bg)]
data-[state=on]:bg-[var(--color-interactive-selected-bg)]
```

Replace with:

```
hover:bg-interactive-hover
active:bg-interactive-active
data-[state=on]:bg-interactive-selected
```

Files: `toggle-group.tsx` line 30, `LadderTable.tsx` line 296.

### `tabs.tsx` — interactive state classes

```
hover:bg-indigo-500/10 hover:text-indigo-700
active:text-indigo-800
data-[state=active]:border-indigo-300/80
data-[state=active]:bg-indigo-500/16
data-[state=active]:text-indigo-700
dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200
dark:active:bg-indigo-500/30 dark:active:text-indigo-100
dark:data-[state=active]:border-indigo-500/50
dark:data-[state=active]:bg-indigo-500/24
dark:data-[state=active]:text-indigo-200
```

Replace with:

```
hover:bg-interactive-hover
active:bg-interactive-active
data-[state=active]:bg-interactive-selected
data-[state=active]:border-interactive-selected-border
data-[state=active]:text-income-net
```

Note: `hover:text-*` and `active:text-*` foreground tokens will be
added in a future pass once interactive foreground tokens are defined.
For now keep `hover:text-indigo-700 dark:hover:text-indigo-200` as-is.

### `text-[11px]` → `text-badge`

Files: `globals.css`, `DepositFormDialog.tsx`, `LadderTable.tsx`, `MonthlyFlow.tsx`.
All instances.

---

## Commit 3 — Fix misidentified items

### `bg-portfolio-surface dark:bg-portfolio-surface`

The dark variant uses `hsl(var(--card) / 0.48)` — opacity on a potentially
sticky/fixed surface. Replace with solid token:

```css
.bg-portfolio-surface {
  background: var(--color-surface-base);
}
```

Remove the `.dark .bg-portfolio-surface` override entirely —
`--color-surface-base` already swaps correctly in dark mode.

### `dark:border-indigo-500/30` in `tabs.tsx` line 17

Replace with `dark:border-interactive-selected-border` or `border-subtle`
depending on context. Check visually after replacement.

### `calendar.tsx` interactive states

```
hover:bg-black/5 active:bg-black/10
dark:hover:bg-white/10 dark:active:bg-white/15
```

These are theme-neutral overlays, not brand colors.
Keep as-is — do not replace with interactive tokens.
These are correct for a calendar which should feel neutral.

---

## Verification checklist

- [ ] Light mode: all indigo brand colors consistent across tabs, toggles, buttons
- [ ] Dark mode: same consistency check
- [ ] Amber warning states: MonthlyFlow pills, StatsGrid pills, alert banners
- [ ] Emerald success states: MonthlyFlow pills, StatsGrid pills
- [ ] Bank names: sky/teal color consistent across Timeline and Cash Flow
- [ ] Danger states: Delete button, Discard button, error borders consistent
- [ ] Info tint: wizard preview panel, sample data banner consistent
- [ ] No `bg-[var(--...)]` remaining in codebase
- [ ] No `text-[11px]` remaining — all replaced with `text-badge`
- [ ] No TypeScript errors
- [ ] No behavior changes
