import { Field, Lines, LoadingRegion, Repeat, Skeleton } from './SkeletonPrimitives';

export function InfoSkeleton() {
  return <LoadingRegion label="Loading platform information…" className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20"><Skeleton className="mb-12 h-4 w-40"/><header className="grid gap-8 border-b border-border pb-12 md:grid-cols-[1fr_240px] md:items-end"><div><Skeleton className="mb-5 h-4 w-52"/><Skeleton className="h-12 w-3/4 sm:h-14"/><div className="mt-5 max-w-xl"><Lines/></div></div><div className="flex items-center gap-3"><Skeleton className="size-[60px] shrink-0 rounded-2xl"/><div className="flex-1"><Lines count={1}/></div></div></header><div className="my-10 max-w-3xl"><Lines count={3}/></div><div className="grid gap-5 md:grid-cols-2"><Repeat count={4}><section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><Skeleton className="mb-6 size-6"/><Skeleton className="mb-4 h-7 w-48 max-w-full"/><Lines count={3}/></section></Repeat></div></LoadingRegion>;
}
export function PasswordSkeleton() {
  return <LoadingRegion label="Loading password settings…" className="page-shell max-w-lg"><Skeleton className="h-9 w-60 max-w-full"/><div className="mt-3"><Lines/></div><Skeleton className="my-6 h-4 w-36"/><div className="space-y-5"><Field/><Field/><Skeleton className="h-11 w-full"/></div></LoadingRegion>;
}
export function TwoFactorSkeleton() {
  return <LoadingRegion label="Loading verification…" className="mx-auto w-full max-w-lg px-5 py-16"><div className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"><Skeleton className="h-6 w-48"/><Lines/><Field/><Skeleton className="h-10 w-40"/></div></LoadingRegion>;
}
