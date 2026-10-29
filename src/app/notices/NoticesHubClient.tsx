"use client";

import Link from "next/link";

import {useVisibleNoticeReads} from "@/components/notice-read-provider";
import {SignInCard} from "@/components/auth/SignInCard";
import {useCatalog} from "@/components/catalog-provider";
import { noticeTags } from "@/lib/platform/notice-tags";
import { semesterLabel } from "@/lib/semester-label";
import { bsDateParts } from "@/lib/nepali-date";
import { useEffect, useMemo, useState, useRef } from "react";
import { BookOpen, Bell, Search, ExternalLink, FileText, SlidersHorizontal, RotateCcw, ArrowUpRight, Pin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NoticeHubItem {
  tags?: string[]; targetCourseSlug?: string;
  id: string;
  title: string;
  targetPortal: "all" | "neopathshala" | "entrance" | "admin";
  targetSemester?: number | null;
  targetSemesters?: number[];
  category: string;
  priority: string;
  targetAudience: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  externalLink?: string;
  isPinned: boolean;
  published: boolean;
  status?: string;
  showInTicker?: boolean;
  tickerHeadline?: string;
  bannerExpiresAt?: string | null;
  expiresAt?: string | null;
  publishedAt: string;
  author: string;
  department?: string;
  views?: number;
  downloads?: number;
}

interface NoticesHubClientProps { locked?:boolean; courseSlug:string; initialSemester?: string; initialNotices: NoticeHubItem[] }
function safeLink(value?: string) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
const NOTICES_PER_PAGE = 8;
const dateParts = (value: string) => bsDateParts(value, "notice");
function NoticeFilterSkeleton(){
 return <aside className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between gap-3 border-b border-border p-5"><div className="h-4 w-20 rounded bg-muted"/><div className="h-8 w-16 rounded-lg bg-muted"/></div><div className="space-y-6 p-5"><div className="space-y-3"><div className="h-3 w-20 rounded bg-muted"/><div className="h-4 w-36 rounded bg-muted"/></div><div className="space-y-3"><div className="h-3 w-24 rounded bg-muted"/><div className="grid grid-cols-3 gap-2">{Array.from({length:6},(_,i)=><div key={i} className="h-8 rounded-lg bg-muted"/>)}</div></div><div className="space-y-3 border-t border-border pt-5"><div className="h-3 w-16 rounded bg-muted"/><div className="flex gap-2"><div className="h-8 w-20 rounded-lg bg-muted"/><div className="h-8 w-24 rounded-lg bg-muted"/></div></div></div></aside>;
}
export function NoticesHubClient({ locked=false,courseSlug,initialNotices, initialSemester = "all" }: NoticesHubClientProps) {
  const noticeRoot=useRef<HTMLDivElement>(null);
  const {ACADEMIC_COURSES}=useCatalog();
  const course=ACADEMIC_COURSES[courseSlug];
  const [semester, setSemester] = useState(initialSemester);
  const [category, setCategory] = useState("all");
  const [draftSemester, setDraftSemester] = useState(initialSemester);
  const [draftCategory, setDraftCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { setSemester(initialSemester); setDraftSemester(initialSemester); setPage(1); }, [initialSemester]);
  const categories = useMemo(() => Array.from(new Map(initialNotices.flatMap(noticeTags).map(tag => [tag.toLowerCase(), tag])).values()).sort(), [initialNotices]);
  const notices = useMemo(() => initialNotices.filter(n => {
    const targets = n.targetSemesters?.length ? n.targetSemesters : n.targetSemester ? [n.targetSemester] : [];
    return (!n.targetCourseSlug || n.targetCourseSlug===courseSlug) && (semester === "all" || !targets.length || targets.includes(Number(semester))) && (category === "all" || noticeTags(n).some(tag => tag.toLowerCase() === category.toLowerCase())) && `${n.title} ${noticeTags(n).join(" ")} ${n.content} ${n.targetAudience} ${n.author}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a,b) => Number(b.isPinned) - Number(a.isPinned) || dateParts(b.publishedAt).sortKey - dateParts(a.publishedAt).sortKey), [initialNotices, semester, category, query,courseSlug]);
  const totalPages = Math.max(1, Math.ceil(notices.length / NOTICES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleNotices = notices.slice((currentPage - 1) * NOTICES_PER_PAGE, currentPage * NOTICES_PER_PAGE);
  useVisibleNoticeReads(noticeRoot,locked,visibleNotices.map(notice=>notice.id).join(","));
  const changed = draftSemester !== semester || draftCategory !== category;
  function reset() { setPage(1); setSemester("all"); setDraftSemester("all"); setCategory("all"); setDraftCategory("all"); setQuery(""); const url = new URL(window.location.href); url.searchParams.set("semester", "all"); window.history.replaceState({}, "", url); }
  function apply() {
    setPage(1);setSemester(draftSemester); setCategory(draftCategory); setFiltersOpen(false);
    const url = new URL(window.location.href); url.searchParams.set("semester", draftSemester); window.history.replaceState({}, "", url);
  }
  return <div ref={noticeRoot} className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
    <header className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="eyebrow mb-3 flex items-center gap-2"><Bell size={14} strokeWidth={1.7} className="text-primary" aria-hidden="true"/>Stay up to date</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Notice board</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Exam notices, results, and updates for your {course?.studySystem==='year'?"year":"semester"}.</p></div><Button asChild variant="outline" className="h-10 shrink-0 gap-3 self-start px-4 sm:self-center"><Link href="/resources"><BookOpen size={15} aria-hidden="true"/><span>Resources</span><ArrowUpRight size={14} aria-hidden="true"/></Link></Button></header>
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      {locked&&<div className="order-0 min-w-0 lg:col-start-1 [&>section]:mb-0"><SignInCard title="Sign in to view notices" description="Sign in or create an account to see notices and updates for your course." href="/login?reason=notices"/></div>}
      <div inert={locked} aria-hidden={locked||undefined} className={cn("order-1 min-w-0 lg:col-start-2 lg:row-start-1",locked&&"pointer-events-none select-none opacity-40 lg:row-span-2")}>{locked?<NoticeFilterSkeleton/>:<aside aria-label="Notice filters" className="rounded-2xl border border-border bg-card lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-112px)] lg:min-h-0 lg:flex-col lg:overflow-hidden"><div className={cn("flex items-center justify-between gap-3 shrink-0 border-border px-5 py-4 lg:border-b", filtersOpen && "border-b")}><button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="notice-filter-options" className="flex items-center gap-2 text-sm font-semibold lg:pointer-events-none"><SlidersHorizontal size={17} strokeWidth={1.5} />Filter<ChevronDown size={14} className={cn("lg:hidden", filtersOpen && "rotate-180")} /></button><div className="flex items-center gap-2"><button type="button" onClick={reset} aria-label="Reset filters" title="Reset filters" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw size={15} /></button><Button size="sm" className="h-8 px-4 text-xs" onClick={apply} aria-label={changed ? "Apply changed notice filters" : "Apply notice filters"}>Apply{changed && <span className="ml-2 h-1.5 w-1.5 rounded-full bg-current" />}</Button></div></div><div id="notice-filter-options" tabIndex={0} aria-label="Filter options" className={cn("min-h-0 max-h-[65dvh] space-y-4 overflow-y-auto p-4 lg:max-h-none lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]", !filtersOpen && "hidden lg:block")}><div><p className="mb-2 text-xs font-semibold">Your course</p><p className="text-sm text-primary">{course?.shortName||courseSlug||"Your registered course"}</p></div><fieldset><legend className="mb-3 text-xs font-semibold">{course?.studySystem==='year'?'Years':'Semesters'}</legend><div className="flex flex-wrap gap-2">{["all",...Array.from({length:course?.totalSemesters||8},(_,i) => String(i+1))].map(value => <button type="button" key={value} aria-pressed={draftSemester === value} onClick={() => setDraftSemester(value)} className={cn("rounded-lg border px-3 py-2 text-[11px] transition-colors", draftSemester === value ? "border-primary/30 bg-primary/10 font-medium text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{value === "all" ? course?.studySystem==='year'?"All years":"All SEM" : semesterLabel(Number(value),course).replace(" Semester", " SEM")}</button>)}</div></fieldset><section aria-labelledby="notice-tags-heading" className="border-t border-border pt-4"><h2 id="notice-tags-heading" className="mb-3 text-xs font-semibold">Tags</h2><div className="flex flex-wrap gap-2">{["all", ...categories].map(value => <button type="button" key={value} aria-pressed={draftCategory === value} onClick={() => setDraftCategory(value)} className={cn("rounded-lg border px-3 py-2 text-[11px] transition-colors", draftCategory === value ? "border-primary/30 bg-primary/10 font-medium text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{value === "all" ? "All tags" : value}</button>)}</div>{notices.length > NOTICES_PER_PAGE && <nav aria-label="Notice pagination" className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span role="status" className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button></nav>}</section></div></aside>}</div>
      <section inert={locked} aria-hidden={locked||undefined} aria-label="Notice feed" className={cn("order-2 flex min-w-0 flex-col lg:col-start-1",locked&&"pointer-events-none select-none opacity-40")}><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="relative w-full"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input aria-label="Search notices" placeholder="Search notices, results, or routines…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm" /></div>{semester !== "all" && <span className="text-xs text-muted-foreground">{semesterLabel(Number(semester),course)}</span>}</div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">{visibleNotices.map(notice => {
        const date = dateParts(notice.publishedAt);
        const external = safeLink(notice.externalLink);
        const attachment = safeLink(notice.attachmentUrl);
        let source = notice.department || notice.author || "neoPathshala";
        if (external?.startsWith("http")) source = new URL(external).hostname;
        const targets = notice.targetSemesters?.length ? notice.targetSemesters : notice.targetSemester ? [notice.targetSemester] : [];
        return <article data-notice-id={notice.id} key={notice.id} id={notice.id} className="group scroll-mt-28 border-b border-border p-4 last:border-0 sm:p-5"><div className="flex gap-4 sm:gap-5"><div title={date.label} className="w-12 shrink-0 border-r border-border pr-4 pt-0.5 text-center sm:w-14"><span className="block text-2xl font-semibold tracking-tight">{date.day}</span><span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{date.month}</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-bold leading-6 sm:text-base">{external || attachment ? <a href={external || attachment || undefined} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{notice.title}</a> : notice.title}</h2>{external && <a href={external} aria-label={`Open source for ${notice.title}`} target="_blank" rel="noopener noreferrer" className="mt-1 shrink-0 text-muted-foreground hover:text-primary"><ExternalLink size={14} /></a>}</div><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] text-muted-foreground"><span className="max-w-48 truncate">{source}</span><span aria-hidden="true">·</span><span>{targets.length ? targets.map(s => `${semesterLabel(s,course)}`).join(", ") : course?.studySystem==='year'?"All years":"All semesters"}</span>{noticeTags(notice).map(tag => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-foreground/75">{tag}</span>)}{notice.isPinned && <span className="inline-flex items-center gap-1 text-primary"><Pin size={10} />Pinned</span>}{["URGENT", "CRITICAL_URGENT"].includes(notice.priority) && <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">Urgent</span>}</div>{attachment && <a href={attachment} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-[11px] hover:border-primary/40 hover:text-primary"><FileText size={13} className="shrink-0" /><span className="truncate">{notice.attachmentName || "View attachment"}</span>{notice.attachmentSize && <span className="shrink-0 text-muted-foreground">{notice.attachmentSize}</span>}<ArrowUpRight size={12} className="shrink-0" /></a>}</div></div></article>;
      })}{locked&&<div className="divide-y divide-border">{[0,1,2].map(row=><div key={row} className="space-y-4 p-5"><div className="h-4 w-3/4 rounded bg-muted"/><div className="h-3 w-1/2 rounded bg-muted"/><div className="h-8 w-28 rounded bg-muted"/></div>)}</div>}{!locked&&!notices.length && <div className="px-6 py-16 text-center"><Bell size={28} strokeWidth={1.5} className="mx-auto mb-4 text-muted-foreground" /><h2 className="text-sm font-semibold">No notices found</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Try another {course?.studySystem==='year'?"year":"semester"}, tag, or search term.</p><Button variant="outline" onClick={reset} className="mt-5">Clear filters</Button></div>}</div>{notices.length > NOTICES_PER_PAGE && <nav aria-label="Notice pagination" className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span role="status" className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button></nav>}</section>
    </div>
  </div>;
}
