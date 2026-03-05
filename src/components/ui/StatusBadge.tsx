import { Badge } from "@/components/ui/badge";

type InvestmentStatus = "active" | "matured" | "settled";

interface StatusBadgeProps {
  status: InvestmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "settled") return <Badge variant="success">Settled</Badge>;
  if (status === "matured") return <Badge variant="warning">Matured</Badge>;
  return <Badge variant="secondary">Active</Badge>;
}
