import { Skeleton } from "@/components/loading/LoadingSkeleton";
export default function Loading() {
  return <section role="status" aria-label="Loading recovery page" aria-busy="true" data-route-loading className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16"><Skeleton className="h-36 w-56" /><Skeleton className="h-3 w-28" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex gap-3"><Skeleton className="h-11 w-36" /><Skeleton className="h-11 w-36" /></div></section>;
}
