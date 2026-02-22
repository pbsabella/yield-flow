"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "bg-muted/70 border-subtle inline-flex flex-wrap items-center gap-1 rounded-lg border p-1 dark:border-indigo-500/30",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "text-muted-foreground focus-visible:ring-primary/60 data-[disabled]:hover:text-muted-foreground active:bg-interactive-selected rounded-lg border border-transparent px-4 py-2 text-sm font-semibold transition-colors duration-150 ease-out hover:bg-indigo-500/10 hover:text-indigo-700 focus-visible:ring-2 active:text-indigo-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:hover:bg-transparent data-[state=active]:border-indigo-300/80 data-[state=active]:bg-indigo-500/16 data-[state=active]:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200 dark:active:bg-indigo-500/30 dark:active:text-indigo-100 dark:data-[state=active]:border-indigo-500/50 dark:data-[state=active]:bg-indigo-500/24 dark:data-[state=active]:text-indigo-200",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn(className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
