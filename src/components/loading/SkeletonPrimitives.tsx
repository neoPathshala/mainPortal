import type { ReactNode } from "react";
import { Skeleton } from "./LoadingSkeleton";
export { Skeleton };
export function Repeat({ count, children }: { count: number; children: ReactNode }) {
  return <>{Array.from({ length: count }, (_, index) => <div key={index} className="min-w-0">{children}</div>)}</>;
}
export function Lines({ count = 2 }: { count?: number }) {
  return <div className="space-y-3"><Repeat count={count}><Skeleton className="h-3 w-full" /></Repeat><Skeleton className="h-3 w-2/3" /></div>;
}
export function Field({ tall = false }: { tall?: boolean }) {
  return <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className={tall ? "h-56 w-full rounded-lg" : "h-11 w-full rounded-lg"} /></div>;
}
export function LoadingRegion({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <div role="status" aria-live="polite" aria-busy="true" data-route-loading className={className}><span className="sr-only">{label}</span><div aria-hidden="true">{children}</div></div>;
}
