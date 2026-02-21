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
      "bg-muted/70 inline-flex flex-wrap items-center gap-1 rounded-lg border border-indigo-200 p-1 dark:border-indigo-500/30",
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
      "text-muted-foreground focus-visible:ring-primary/60 data-[disabled]:hover:text-muted-foreground cursor-pointer rounded-md border border-transparent px-3 py-2 text-xs font-semibold transition-colors duration-200 ease-out hover:bg-indigo-500/10 hover:text-indigo-700 focus-visible:ring-2 focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:hover:bg-transparent data-[state=on]:border-indigo-300/80 data-[state=on]:bg-indigo-500/16 data-[state=on]:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200 dark:data-[state=on]:border-indigo-500/50 dark:data-[state=on]:bg-indigo-500/24 dark:data-[state=on]:text-indigo-200",
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
