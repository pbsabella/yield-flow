type Props = {
  label: string;
  className?: string;
};

export default function TimelineBadge({ label, className }: Props) {
  return <span className={`status-pill-neutral ${className ?? ""}`}>{label}</span>;
}
