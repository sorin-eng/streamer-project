import { Skeleton } from '@/components/ui/skeleton';

export const DealsSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);

export const StreamersSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-14 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    ))}
  </div>
);

export const CampaignsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 animate-fade-in">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-18" />
        </div>
      </div>
    ))}
  </div>
);

export const MessagesSkeleton = () => (
  <div className="flex rounded-xl border border-border bg-card overflow-hidden h-[calc(100dvh-10rem)] animate-fade-in">
    <div className="w-72 border-r border-border hidden md:block">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className={`h-16 rounded-xl ${i % 2 === 0 ? 'w-52' : 'w-44'}`} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
    <div className="border-b border-border bg-muted px-4 py-3 flex gap-8">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex gap-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);
