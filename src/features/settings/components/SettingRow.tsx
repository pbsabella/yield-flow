import { Separator } from "@/components/ui/separator";

interface SettingRowProps {
  label: string;
  description?: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  separator?: boolean;
}

export function SettingRow({
  label,
  description,
  note,
  children,
  separator = true,
}: SettingRowProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-stack-md">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {note}
        </div>
        {children}
      </div>
      {separator && <Separator />}
    </>
  );
}
