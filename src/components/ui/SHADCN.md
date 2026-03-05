# shadcn/ui Upgrade Guide

## File Classification

### Customized shadcn — re-apply overrides after upgrade

These files diverge from upstream. After overwriting, run the grep command below to find every site to re-apply.

| File           | What was changed                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `badge.tsx`    | Status variants (`info/warning/success/alert`) imported from `variants.ts` and spread into cva; `asChild` prop via `Slot.Root`                            |
| `button.tsx`   | `buttonVariants` defined in `variants.ts` and imported here (not inline)                                                                                  |
| `card.tsx`     | `size` prop (`"default"\|"sm"`) on `Card`; `CardAction` component added                                                                                   |
| `alert.tsx`    | `AlertAction` component added (absolute top-right slot)                                                                                                   |
| `select.tsx`   | `size` prop (`"sm"\|"default"`) on `SelectTrigger`                                                                                                        |
| `field.tsx`    | `fieldVariants` defined in `variants.ts`; 6 non-standard exports: `FieldSeparator`, `FieldTitle`, `FieldContent`, `FieldError`, `FieldSet`, `FieldLegend` |
| `toggle.tsx`   | `toggleVariants` (including `card` variant) defined in `variants.ts` and imported here                                                                    |
| `calendar.tsx` | `buttonVariant` prop on `Calendar`; custom `components` object (Root/Chevron/DayButton/WeekNumber); `CalendarDayButton` function exported                 |

### Pure shadcn and Custom (non-shadcn) — safe to overwrite

These files have no local customizations or never touched by upgrades. Run `npx shadcn@latest add <component> --overwrite` freely.

---

## Upgrade Procedure

```bash
# 1. Snapshot current state
git add -A && git stash

# 2. Upgrade a specific component
npx shadcn@latest add button --overwrite

# 3. Find all overrides to re-apply
grep -n "@shadcn-override" src/components/ui/button.tsx

# 4. Re-apply each override
#    Typically: restore import from variants.ts + any added props/components

# 5. Verify the build
bun run build

# 6. Restore stash (custom files are unaffected — no conflicts)
git stash pop
```

To audit all overrides across all files at once:

```bash
grep -rn "@shadcn-override" src/components/ui/
```

---

## Extension Rules

1. **New CVA variants** — always add to `variants.ts`, never inline in component files.
2. **New props on shadcn components** — add `// @shadcn-override: <reason>` on the line or the block.
3. **New non-shadcn components** — add a row to the "Custom" table above.
4. **Pure shadcn files promoted to customized** — move them to the "Customized" table and add the first `@shadcn-override` annotation.
5. **Never add `@apply` for token-based styles** — use Tailwind utilities referencing CSS custom properties instead (Tailwind v4 pattern).

---

## variants.ts — What lives there

`src/components/ui/variants.ts` is the single source of truth for all CVA definitions:

| Export                | Used by                      |
| --------------------- | ---------------------------- |
| `badgeStatusVariants` | `badge.tsx`                  |
| `buttonVariants`      | `button.tsx`, `calendar.tsx` |
| `fieldVariants`       | `field.tsx`                  |
| `toggleVariants`      | `toggle.tsx`                 |

When shadcn upgrades a component that previously defined variants inline (e.g. `buttonVariants` used to live in `button.tsx`), do **not** copy the upstream cva back into the component file. Instead, keep the import from `variants.ts` and merge any new upstream variant additions into `variants.ts`.
