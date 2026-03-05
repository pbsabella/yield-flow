/**
 * Shared CVA variant definitions and extensions for shadcn/ui components.
 *
 * All cva() definitions that deviate from shadcn defaults live here.
 * After any shadcn component upgrade, diff against the new shadcn output and
 * re-apply only the entries below that have changed.
 *
 * Spread pattern (badge status variants):
 *   import { badgeStatusVariants } from "@/components/ui/variants"
 *   const badgeVariants = cva(base, {
 *     variants: { variant: { ...shadcnDefaults, ...badgeStatusVariants } }
 *   })
 *
 * Direct import pattern (button, field):
 *   import { buttonVariants } from "@/components/ui/variants"
 */

import { cva } from "class-variance-authority"

// ─── Badge status ─────────────────────────────────────────────────────────────

export const badgeStatusVariants = {
  info:    "bg-status-info-bg border-status-info-border text-status-info-fg",
  warning: "bg-status-warning-bg border-status-warning-border text-status-warning-fg",
  success: "bg-status-success-bg border-status-success-border text-status-success-fg",
  alert:   "bg-status-alert-bg border-status-alert-border text-status-alert-fg",
} as const;

// ─── Button ───────────────────────────────────────────────────────────────────

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-2 aria-invalid:ring-2 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:     "border-border bg-background hover:bg-accent-hover-bg hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:       "hover:bg-accent-hover-bg hover:text-foreground dark:hover:bg-accent-hover-bg/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-status-alert-fg focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:   "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs:        "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm:        "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg:        "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon:      "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ─── Field ────────────────────────────────────────────────────────────────────

export const fieldVariants = cva(
  "data-[invalid=true]:text-destructive gap-2 group/field flex w-full",
  {
    variants: {
      orientation: {
        vertical:
          "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

// ─── Toggle ───────────────────────────────────────────────────────────────────

export const toggleVariants = cva(
  "hover:text-foreground aria-pressed:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[state=on]:bg-muted gap-1 rounded-lg text-sm font-medium transition-all [&_svg:not([class*='size-'])]:size-4 group/toggle hover:bg-accent-hover-bg inline-flex items-center justify-center whitespace-nowrap outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-input hover:bg-accent-hover-bg border bg-transparent",
        // @shadcn-override: radio-card — inset shadow on selected state highlights all 4 sides
        // even when the left border is collapsed in a toggle-group.
        card: "cursor-pointer border-border border bg-transparent hover:!bg-muted/50 data-[state=on]:shadow-[inset_0_0_0_1px_var(--color-primary)] data-[state=on]:!bg-primary/5",
      },
      size: {
        default: "h-8 min-w-8 px-2",
        sm:      "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-1.5 text-[0.8rem]",
        lg:      "h-9 min-w-9 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
