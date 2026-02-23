"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        dropdown:
          "rounded-md transition-colors duration-150 ease-out hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
        dropdown_month:
          "rounded-md transition-colors duration-150 ease-out hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
        dropdown_year:
          "rounded-md transition-colors duration-150 ease-out hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
        caption_label: "text-sm font-semibold text-primary",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-7 w-7 bg-surface-base p-0 opacity-70 transition-opacity duration-150 ease-out hover:opacity-100 active:opacity-90",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.7rem]",
        row: "mt-2 flex w-full",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md text-center leading-9 transition-colors duration-150 ease-out focus-visible:ring-primary/60 focus-visible:ring-2 aria-selected:opacity-100 aria-selected:bg-indigo-600 aria-selected:text-white dark:aria-selected:bg-indigo-500 dark:aria-selected:text-white",
          "hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15",
        ),
        day_selected:
          "bg-indigo-600 text-white hover:bg-indigo-600/90 active:bg-indigo-700 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400 dark:active:bg-indigo-600",
        day_today:
          "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
