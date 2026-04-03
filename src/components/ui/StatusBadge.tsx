import { Badge } from "@/components/ui/badge";
import type { EffectiveStatus } from "@/features/portfolio/hooks/usePortfolioData";

interface StatusBadgeProps {
  status: EffectiveStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "settled") return <Badge variant="success">Settled</Badge>;
  if (status === "matured") return <Badge variant="warning">Matured</Badge>;
  if (status === "closed") return <Badge variant="alert">Closed</Badge>;
  return <Badge variant="secondary">Active</Badge>;
}
