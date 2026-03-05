"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  footer?: React.ReactNode;
  footerClassName?: string;
  contentClassName?: string;
  cardClassName?: string;
  triggerClassName?: string;
}

export function CollapsibleCard({
  trigger,
  children,
  defaultOpen = false,
  footer,
  footerClassName,
  contentClassName,
  cardClassName,
  triggerClassName,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("p-0", cardClassName)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-0">
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between px-4 py-3 hover:bg-muted transition-colors",
              open && "bg-primary/5",
              triggerClassName,
            )}
          >
            {trigger}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={cn("border-t", contentClassName)}>
            {children}
          </CardContent>
        </CollapsibleContent>
        {footer && (
          <CardFooter className={footerClassName}>{footer}</CardFooter>
        )}
      </Collapsible>
    </Card>
  );
}
