"use client";

import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  onBlur?: () => void;
};

export default function DatePicker({ value, onChange, id, className, onBlur }: Props) {
  const date = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "border-border bg-card font-financial h-12 w-full justify-between text-left font-normal hover:bg-transparent active:bg-transparent",
            className,
          )}
          onBlur={onBlur}
        >
          <span className={cn(!value && "text-foreground")}>
            {value ? format(date!, "PPP") : "Pick a date"}
          </span>
          <CalendarDays className="text-foreground h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => {
            if (!next) return;
            onChange(format(next, "yyyy-MM-dd"));
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
