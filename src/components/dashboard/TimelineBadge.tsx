type Props = {
  label: string;
  className?: string;
};

export default function TimelineBadge({ label, className }: Props) {
  return (
    <span
      className={`border-subtle bg-surface text-muted font-financial inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
