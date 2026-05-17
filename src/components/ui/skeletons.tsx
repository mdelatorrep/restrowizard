import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Standard module page skeleton: header + KPI strip + content block.
 * Use as Suspense / loading fallback inside any module page.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 md:space-y-6", className)} role="status" aria-live="polite">
      <span className="sr-only">Cargando contenido…</span>
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 md:p-8">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* KPI strip */}
      <KPISkeleton count={4} />
      {/* Content */}
      <div className="rounded-xl border bg-card p-4 md:p-6 space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

export function KPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid gap-2 p-3 border-b bg-muted/30" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-2 p-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-8 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
