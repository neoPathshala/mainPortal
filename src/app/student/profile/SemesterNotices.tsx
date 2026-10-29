"use client";
import {useVisibleNoticeReads} from "@/components/notice-read-provider";
import {useCatalog} from "@/components/catalog-provider";
import { semesterLabel } from "@/lib/semester-label";
import { noticeTags } from "@/lib/platform/notice-tags";
import { useState, useRef } from "react";
import Link from "next/link";
import { Bell, ChevronRight, FileText, ArrowUpRight, Pin, Search } from "lucide-react";
import { noticesForSemester, type SemesterNotice } from "@/lib/semester-notices";
import { formatBSDateTime } from "@/lib/nepali-date";
import { cn } from "@/lib/utils";

function safeLink(value?: string) {
  if (typeof value !== "string" || !value || /[\u0000-\u0020\\]/.test(value)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function SemesterNotices({ notices, semester, courseSlug,compact = false }: {courseSlug?:string; notices: SemesterNotice[]; semester: number | null; compact?: boolean }) {
  const noticeRoot=useRef<HTMLElement>(null);
  const {getCourseBySlug}=useCatalog();const course=getCourseBySlug(courseSlug||"");
  const [scope, setScope] = useState("relevant");
  const [query, setQuery] = useState("");
  const matching = noticesForSemester(notices, semester,courseSlug).filter((notice) => {
    const targets = notice.targetSemesters?.length ? notice.targetSemesters : notice.targetSemester ? [notice.targetSemester] : [];
    const all = targets.length === 0;
    return (scope === "relevant" || (scope === "general" ? all : !all)) && `${notice.title} ${noticeTags(notice).join(" ")} ${notice.category} ${notice.content}`.toLowerCase().includes(query.toLowerCase());
  });
  useVisibleNoticeReads(noticeRoot,false,matching.slice(0,compact?3:undefined).map(notice=>notice.id).join(","));
  return <section ref={noticeRoot} className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} className="text-primary" />Your notice board</h2><p className="mt-2 text-xs text-muted-foreground">{semester ? `${semesterLabel(semester,course)} and general announcements` : "General announcements · Select a semester for targeted notices"}</p></div>{compact && <Link href="/student/profile?tab=notices" className="flex items-center gap-1 text-xs text-primary">View all<ChevronRight size={13} /></Link>}</div>{!compact && <div className="space-y-4 border-b border-border p-5"><div className="flex flex-wrap gap-2">{[{ id: "relevant", label: "All relevant" }, { id: "semester", label: semester ? `${semesterLabel(semester,course)}` : "My study period" }, { id: "general", label: "All study periods" }].map((item) => <button key={item.id} type="button" disabled={item.id === "semester" && !semester} aria-pressed={scope === item.id} onClick={() => setScope(item.id)} className={cn("rounded-lg border px-3 py-2 text-xs disabled:opacity-40", scope === item.id ? "border-primary/20 bg-primary/8 text-primary" : "border-border text-muted-foreground")}>{item.label}</button>)}</div><div className="relative"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input aria-label="Search your notices" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, categories, or announcements" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs" /></div></div>}<div className="divide-y divide-border">{matching.slice(0, compact ? 3 : undefined).map((notice) => {
    const attachment = safeLink(notice.attachmentUrl);
    const external = safeLink(notice.externalLink);
    return <article data-notice-id={notice.id} key={notice.id} className="p-5"><div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">{noticeTags(notice).map(tag => <span key={tag} className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">{tag}</span>)}<span className="text-primary">{notice.targetSemesters?.length ? notice.targetSemesters.map(value=>semesterLabel(value,course)).join(", ") : notice.targetSemester ? `${semesterLabel(notice.targetSemester,course)}` : "All study periods"}</span>{notice.isPinned && <Pin size={11} className="ml-auto text-muted-foreground" />}</div><h3 className="text-sm font-bold leading-6">{external || attachment ? <a href={external || attachment || undefined} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{notice.title}</a> : notice.title}</h3>{attachment && <a href={attachment} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-[11px] hover:border-primary/40 hover:text-primary"><FileText size={13} className="shrink-0" /><span className="truncate">{notice.attachmentName || "View attachment"}</span>{notice.attachmentSize && <span className="shrink-0 text-muted-foreground">{notice.attachmentSize}</span>}<ArrowUpRight size={12} className="shrink-0" /></a>}<p className="mt-3 text-[10px] text-muted-foreground">Published {formatBSDateTime(notice.publishedAt, "notice")}</p></article>; })}</div>{!matching.length && <div className="px-5 py-10 text-center"><Bell size={22} className="mx-auto mb-3 text-muted-foreground" /><p className="text-sm font-medium">No matching notices</p><p className="mt-2 text-xs leading-6 text-muted-foreground">New published announcements for your study period will appear here.</p></div>}{!semester && <div className="border-t border-border px-5 py-4"><Link href="/student/profile?tab=details" className="text-xs font-medium text-primary">Choose your study period in profile settings →</Link></div>}</section>;
}
