"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--color-status-success-bg)",
          "--success-border": "var(--color-status-success-border)",
          "--success-text": "var(--color-status-success-fg)",
          "--error-bg": "var(--color-status-alert-bg)",
          "--error-border": "var(--color-status-alert-border)",
          "--error-text": "var(--color-status-alert-fg)",
          "--warning-bg": "var(--color-status-warning-bg)",
          "--warning-border": "var(--color-status-warning-border)",
          "--warning-text": "var(--color-status-warning-fg)",
          "--info-bg": "var(--color-status-info-bg)",
          "--info-border": "var(--color-status-info-border)",
          "--info-text": "var(--color-status-info-fg)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
