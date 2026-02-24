/**
 * Shared CVA variant extensions for shadcn/ui components.
 *
 * Usage: spread into the component's cva() variants object.
 * Re-add this spread after any shadcn component upgrade.
 *
 * Example:
 *   import { badgeStatusVariants } from "@/components/ui/variants"
 *   const badgeVariants = cva(base, {
 *     variants: { variant: { ...shadcnVariants, ...badgeStatusVariants } }
 *   })
 */

export const badgeStatusVariants = {
  info:
    "bg-status-info-bg border-status-info-border text-status-info-fg",
  warning:
    "bg-status-warning-bg border-status-warning-border text-status-warning-fg",
  success:
    "bg-status-success-bg border-status-success-border text-status-success-fg",
} as const;
