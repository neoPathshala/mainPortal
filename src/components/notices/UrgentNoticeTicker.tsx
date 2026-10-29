"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { noticeBannerActive } from "@/lib/platform/notice-expiry";
import { cn } from "@/lib/utils";

export interface TickerNotice {
  id: string;
  title: string;
  tickerHeadline?: string;
  category: string;
  priority: string;
  publishedAt: string;
  attachmentUrl?: string;
  attachmentName?: string;
  bannerExpiresAt?: string | null;
  expiresAt?: string | null;
}

interface UrgentNoticeTickerProps {
  notices: TickerNotice[];
}

export function UrgentNoticeTicker({ notices: allNotices }: UrgentNoticeTickerProps) {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    const refresh=()=>setNow(Date.now());
    const next=allNotices.flatMap(notice=>[notice.bannerExpiresAt,notice.expiresAt]).filter((value):value is string=>!!value).map(value=>Date.parse(value)).filter(time=>Number.isFinite(time)&&time>now).sort((a,b)=>a-b)[0];
    const timer=next ? window.setTimeout(refresh,Math.min(Math.max(next-Date.now()+20,20),2147483647)) : null;
    window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);
    return ()=>{if(timer!==null)window.clearTimeout(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[allNotices,now]);
  const notices=allNotices.filter(notice=>noticeBannerActive(notice,now));
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  if (dismissed || !notices?.length) return null;
  const index = activeIdx % notices.length;
  const notice = notices[index];
  const critical = notice.priority === "CRITICAL_URGENT";
  const headline = (notice.tickerHeadline || notice.title).replace(/^[\s🔔📢🚨]+/u, "");
  return <aside aria-label="Important notice" className={cn("border-b font-sans", critical ? "border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100" : "border-emerald-200/70 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100")}>
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", critical ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300")}><BellRing size={18} strokeWidth={1.7} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] opacity-65">{critical ? "Important update" : "TU notice board"}</p><Link href={`/notices#${encodeURIComponent(notice.id)}`} className="block text-xs font-medium leading-5 hover:underline sm:truncate sm:text-[13px]" title={headline}>{headline}</Link></div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2"><Link href={`/notices#${encodeURIComponent(notice.id)}`} className="hidden items-center gap-1.5 rounded-lg border border-current/15 px-3 py-2 text-[11px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 sm:inline-flex">View notice<ArrowUpRight size={13} /></Link>{notices.length > 1 && <div className="hidden items-center gap-0.5 border-l border-current/15 pl-2 sm:flex"><button type="button" aria-label="Previous notice" onClick={() => setActiveIdx((index + notices.length - 1) % notices.length)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><ChevronLeft size={14} /></button><span className="min-w-7 text-center text-[10px] tabular-nums opacity-70">{index + 1}/{notices.length}</span><button type="button" aria-label="Next notice" onClick={() => setActiveIdx((index + 1) % notices.length)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><ChevronRight size={14} /></button></div>}<button type="button" aria-label="Dismiss notice banner" onClick={() => setDismissed(true)} className="-mr-2 ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg opacity-60 transition-colors hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"><X size={14} /></button></div>
    </div>
  </aside>;
}
