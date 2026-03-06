import { Container } from '@/components/layout/Container';
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="py-6 space-y-stack-xl">
      <Container className="py-6 space-y-stack-xl">
        <div className="space-y-stack-xs">
          <Skeleton className="h-8 w-36 bg-muted-foreground/10" />
          <Skeleton className="h-4 w-24 bg-muted-foreground/10" />
        </div>

        <div className="rounded-lg border bg-card px-card-x py-card-y space-y-stack-sm">
          <Skeleton className="h-4 w-32 bg-muted-foreground/10" />
          <Skeleton className="h-4 w-full bg-muted-foreground/10" />
          <Skeleton className="h-4 w-full bg-muted-foreground/10" />
          <Skeleton className="h-4 w-full bg-muted-foreground/10" />
        </div>
      </Container>
    </main>
  );
}
