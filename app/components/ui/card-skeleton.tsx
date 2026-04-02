import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card border border-border/50">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute top-2 left-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="absolute top-2 right-2">
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
