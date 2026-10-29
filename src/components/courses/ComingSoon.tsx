import {coursesComingSoon} from '@/lib/course-availability';
import type {ReactNode} from 'react';
/** Inert blocks mouse, keyboard, and focus access; server gates enforce real access. */
export function ComingSoon({children,disabled=coursesComingSoon}: {children: ReactNode;disabled?:boolean}) {
  if(!disabled)return <>{children}</>;
  return <div className="relative cursor-not-allowed overflow-hidden rounded-2xl"><div inert className="pointer-events-none opacity-50">{children}</div><span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/40 text-lg font-semibold uppercase tracking-[0.16em] text-muted-foreground">Coming soon</span></div>;
}
