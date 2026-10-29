"use client";
import {useCatalog} from "@/components/catalog-provider";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileTabSkeleton } from "@/components/loading/ProfileSkeletons";
import { profileWorkspaceLayout as layout } from "@/lib/profile-workspace-layout";
import { semesterLabel } from "@/lib/semester-label";

import Link from "next/link";
import { Bell, BookOpen, ChevronRight, FileText, GraduationCap, LayoutDashboard, LogOut, Settings2, ShieldCheck } from "lucide-react";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";

import { cn } from "@/lib/utils";

const sections = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "details", label: "Profile settings", icon: Settings2 },
  { id: "security", label: "Security & devices", icon: ShieldCheck },
  { id: "notices", label: "My notices", icon: Bell },
];
const headings: Record<string, { title: string; description: string }> = {
  overview: { title: "Overview", description: "Your account, study resources, and recent activity at a glance." },
  details: { title: "Profile settings", description: "" },
  security: { title: "Security & devices", description: "Review account activity and manage where you’re signed in." },
  notices: { title: "My notices", description: "Published announcements for your course and study period." },
  orders: { title: "Membership", description: "Explore your study options and account membership." },
};
export function ProfileDashboardShell({ courseSlug,tab, name, email, avatarUrl, pending, onSignOut, children, studyHref, semester }: { courseSlug?:string;studyHref: string; semester: number | null; tab: string; name: string; email: string; avatarUrl: string | null; pending: boolean; onSignOut: () => void; children: React.ReactNode }) {
  const {getCourseBySlug}=useCatalog();
  const course=getCourseBySlug(courseSlug||"");
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [nextTab, setNextTab] = useState(tab);
  const heading = headings[tab] || headings.overview;
  return <div data-profile-workspace className={layout.root}><div className={layout.grid}>
    <aside className={layout.sidebar}>
      <div className="hidden border-b border-border px-6 py-6 lg:block"><div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><GraduationCap size={15} />Student workspace</div><p className="text-sm font-semibold">My dashboard</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{semester ? `${semesterLabel(semester,course)} · Your student space` : "Choose your course and study period"}</p></div>
      <div className="min-h-0 flex-1 lg:overflow-y-auto lg:px-3 lg:py-6"><p className="eyebrow mb-3 hidden px-3 lg:block">Account</p><nav aria-label="Student dashboard" className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:p-0">{sections.map((item) => <Link key={item.id} href={`/student/profile?tab=${item.id}`} onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || item.id === tab) return; event.preventDefault(); setNextTab(item.id); startNavigation(() => router.push(`/student/profile?tab=${item.id}`, { scroll: false })); }} aria-current={tab === item.id ? "page" : undefined} className={cn("relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-xs transition-colors", tab === item.id ? "bg-primary/8 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon size={17} strokeWidth={1.7} /><span>{item.label}</span>{tab === item.id && <ChevronRight size={13} className="ml-auto hidden lg:block" />}</Link>)}</nav>
        <div className="mt-7 hidden border-t border-border px-1 pt-6 lg:block"><p className="eyebrow mb-3 px-2">Learning</p>{[{ label: "Resource library", href: studyHref, icon: BookOpen }, { label: "Browse courses", href: "/courses", icon: GraduationCap }, { label: "University notices", href: "/notices", icon: FileText }].map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><item.icon size={17} strokeWidth={1.7} />{item.label}</Link>)}</div>

      </div>
      <div className="hidden border-t border-border p-4 lg:block"><div className="mb-4 flex items-center gap-3 [&>div]:h-9 [&>div]:w-9 [&>div]:rounded-xl [&>div]:text-sm"><ProfileAvatar url={avatarUrl} name={name} /><div className="min-w-0 !h-auto !w-auto flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{email}</p></div></div><button type="button" disabled={pending} onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"><LogOut size={15} />{pending ? "Please wait…" : "Sign out"}</button></div>
    </aside>
    <div className={layout.panel}>
      <div key={tab} role="region" aria-label={heading.title + " content"} tabIndex={0} className={layout.scroll}>{navigating ? <ProfileTabSkeleton tab={nextTab} /> : children}</div>
    </div>
  </div></div>;
}
