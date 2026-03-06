import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label?: string; onClick: () => void };
  secondaryAction?: { label: string; icon?: React.ReactNode; onClick: () => void };
}

export function PageHeader({ title, subtitle, action, secondaryAction }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-stack-md">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 shrink-0">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick} className="gap-1.5">
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick} className="hidden md:flex shrink-0">
              <Plus className="size-4" />
              {action.label ?? "Add investment"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
