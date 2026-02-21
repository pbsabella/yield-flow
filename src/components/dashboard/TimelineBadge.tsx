type Props = {
  label: string;
  className?: string;
};

export default function TimelineBadge({ label, className }: Props) {
  return (
    <span
      className={`border-subtle bg-muted/40 text-muted-foreground inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
