import { Skeleton } from '../../components/ui/skeleton';

/** Skeletons mirror the real layout — this mimics a KPI row plus a table. */
export function SkeletonDemo() {
  return (
    <div className="space-y-4 rounded-xl border bg-background p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-[33px] w-[33px] rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
