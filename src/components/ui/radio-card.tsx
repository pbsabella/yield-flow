import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroupItem } from "@/components/ui/radio-group";

type RadioCardProps = {
  value: string;
  /** id used to associate the card's label with the radio input. */
  id: string;
  /** Whether this card matches the RadioGroup's current value. */
  selected: boolean;
  label: string;
  description?: string;
  /** Decorative leading icon — hidden from screen readers (label text carries meaning). */
  icon?: LucideIcon;
  className?: string;
};

export function RadioCard({
  value,
  id,
  selected,
  label,
  description,
  icon: Icon,
  className,
}: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-stack-sm rounded-lg border p-3 transition-colors hover:bg-accent-hover-bg/50",
        selected ? "border-primary bg-primary/5" : "border-border",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0 transition-colors",
            selected ? "text-accent-fg" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground text-balance">{description}</p>
        )}
      </div>
      <RadioGroupItem id={id} value={value} className="mt-0.5 shrink-0" />
    </label>
  );
}
