"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "border-border-subtle inline-flex flex-wrap items-center gap-1 rounded-md border p-1",
      className,
    )}
    {...props}
  />
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "text-muted-foreground focus-visible:ring-primary/60 data-[disabled]:hover:text-muted-foreground hover:text-foreground active:text-foreground data-[state=on]:border-border-subtle data-[state=on]:text-foreground hover:bg-interactive-hover active:bg-interactive-active data-[state=on]:bg-interactive-selected cursor-pointer rounded-md border border-transparent px-3 py-2 text-xs font-semibold transition-colors duration-150 ease-out focus-visible:ring-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:hover:bg-transparent",
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
