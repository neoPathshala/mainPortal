"use client";
import {periodSlug,periodName} from "@/lib/academic-structure";
import {parentUniversity,resourceCourse} from "@/lib/resource-selection";
import { useCatalog } from "@/components/catalog-provider";
import { ResourcesResultsSkeleton } from "@/components/loading/ResourceSkeletons";

import { semesterLabel } from "@/lib/semester-label";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Check, GraduationCap, Grid2X2, List, RotateCcw, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useStudentPreferences } from "@/components/student-preferences-provider";



import { selectMyElectiveAction } from "@/app/actions";
import { ResourceSubjectCard } from "@/components/courses/ResourceSubjectCard";
import { EMPTY_SUBJECT_STATS, type SubjectCardStatsIndex } from "@/lib/subject-card-stats";

import { cn } from "@/lib/utils";

interface ResourcesClientProps { allowCourseSwitching?: boolean; routeMode?: "resources" | "semester"; studyStats: SubjectCardStatsIndex; selectedElectives?: string[]; hasAccountPreferences?: boolean; initialUniversity?: string; initialFaculty?: string; initialSemester?: number }
export function ResourcesClient({ allowCourseSwitching=false, routeMode="resources", studyStats, selectedElectives = [], initialUniversity = "tribhuwan-university", initialFaculty = "csit", initialSemester = 1 }: ResourcesClientProps) {
  const { getSemesterSummary, electiveSubjects, studentSubjects, ACADEMIC_COURSES, resolveStudentCourse, getCurriculumSubjects, UNIVERSITIES, resolveSubjectRoute } = useCatalog();
  const preferences = useStudentPreferences();
  const router = useRouter();
  const params = useSearchParams();

  const [course, setCourse] = useState(resolveStudentCourse(initialFaculty)?.slug || "csit");
  const [semester, setSemester] = useState(initialSemester >= 1 && initialSemester <= (resolveStudentCourse(initialFaculty)?.totalSemesters||8) ? initialSemester : 1);
  const [browsing, startBrowse] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [selection, setSelection] = useState<{ key: string; electives: string[] } | null>(null);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [selectionError, setSelectionError] = useState(false);
  const [selecting, startSelection] = useTransition();
  useEffect(() => { setSelection(null); }, [selectedElectives, initialFaculty, initialSemester]);
  useEffect(() => { setSelectionMessage(""); }, [course, semester]);
  const selected = ACADEMIC_COURSES[course];
  const university=parentUniversity(selected,UNIVERSITIES)?.id||"";
  const courseLocked=preferences.authenticated&&!!resolveStudentCourse(preferences.courseSlug||"");
  useEffect(() => {
    const explicitCourse = routeMode==="semester" ? initialFaculty : params.get("faculty") || params.get("course");
    const explicitSemester = routeMode==="semester" ? initialSemester : Number(params.get("semester"));
    const nextCourse = resourceCourse(Object.values(ACADEMIC_COURSES),explicitCourse||initialFaculty,courseLocked?preferences.courseSlug:null)?.slug||"";
    setCourse(nextCourse);
    setSemester(explicitSemester >= 1 && explicitSemester <= (resolveStudentCourse(nextCourse)?.totalSemesters||8) && Number.isInteger(explicitSemester) ? explicitSemester : preferences.semester || initialSemester || 1);

  }, [params, preferences.courseSlug, preferences.semester, preferences.authenticated, initialFaculty, initialSemester, initialUniversity,routeMode,courseLocked]);
  useEffect(() => { try { const value = JSON.parse(localStorage.getItem("neopathshala-saved-subjects") || "[]"); if (Array.isArray(value)) setSaved(value.filter((item): item is string => typeof item === "string").slice(0, 500)); } catch {} }, []);
  function browse(nextCourse: string, nextSemester: number, nextUniversity?: string) {
    if(courseLocked)nextCourse=preferences.courseSlug||course;
    else if(exploring&&!allowCourseSwitching)nextCourse=course;
    else if(nextUniversity&&parentUniversity(ACADEMIC_COURSES[nextCourse],UNIVERSITIES)?.id!==nextUniversity){
      nextCourse=Object.values(ACADEMIC_COURSES).find(item=>parentUniversity(item,UNIVERSITIES)?.id===nextUniversity)?.slug||course;
    }
    const actualUniversity=parentUniversity(ACADEMIC_COURSES[nextCourse],UNIVERSITIES)?.id||"";
    nextSemester=Math.max(1,Math.min(nextSemester,ACADEMIC_COURSES[nextCourse]?.totalSemesters||8));
    setCourse(nextCourse); setSemester(nextSemester); setQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("faculty"); url.searchParams.set("course", nextCourse); url.searchParams.set("semester", String(nextSemester)); url.searchParams.set("university", actualUniversity);
    startBrowse(() => routeMode==="semester" ? router.push(`/${nextCourse}/${periodSlug(nextSemester,ACADEMIC_COURSES[nextCourse])}`,{scroll:false}) : router.replace(`${url.pathname}${url.search}`, { scroll: false }));
    // Browsing is temporary for signed-in students; profile settings remain authoritative.
    if (!preferences.authenticated) try {
      localStorage.setItem("neopathshala_selected_course", nextCourse === "csit" ? "csit" : nextCourse);
      localStorage.setItem("neopathshala_selected_semester", String(nextSemester));
      localStorage.setItem("neopathshala_selected_university", actualUniversity);
    } catch {}
  }
  const selectionKey = `${course}/${semester}`;
  const selectedForPage = selection?.key === selectionKey ? selection.electives : course === resolveStudentCourse(initialFaculty)?.slug && semester === initialSemester ? selectedElectives : [];
  const availableElectives = useMemo(() => electiveSubjects(course, semester), [course, semester, university]);
  function selectElective(slug: string) {
    setSelectionMessage("");
    const key = selectionKey;
    startSelection(async () => {
      try {
        const result = await selectMyElectiveAction({ course, semester, slug });
        setSelectionError(!result.success);
        setSelectionMessage(result.message);
        if (result.success && result.electives) {
          setSelection({ key, electives: result.electives });
          router.refresh();
        }
      } catch { setSelectionError(true); setSelectionMessage("Unable to change your elective. Please try again."); }
    });
  }
  const exploring=routeMode==="semester"&&!preferences.authenticated;
  const subjects = useMemo(() => exploring?getCurriculumSubjects(course,semester):studentSubjects(course, semester, selectedForPage), [course, semester, university, selectedForPage,exploring]);
  const semesterTotals=getSemesterSummary(course,semester);
  const subjectKey = (slug: string) => `${course}/${semester}/${slug}`;
  const filtered = useMemo(() => {
    const source = !exploring&&filter === "electives" ? availableElectives : subjects;
    return source.filter(subject =>
      `${subject.name} ${subject.code} ${subject.description || ""}`.toLowerCase().includes(query.toLowerCase()) &&
      (exploring || filter !== "saved" || saved.includes(subjectKey(subject.slug))) &&
      (exploring || filter !== "core" || !subject.isElective)
    ).sort((a, b) => {
      const selectedFirst = exploring ? Number(!!a.isElective)-Number(!!b.isElective) : filter === "electives" ? Number(selectedForPage.includes(b.slug)) - Number(selectedForPage.includes(a.slug)) : 0;
      return selectedFirst || Number(!a.code) - Number(!b.code) || a.code.localeCompare(b.code, "en", { numeric: true, sensitivity: "base" });
    });
  }, [subjects, availableElectives, query, filter, saved, course, semester, selectedForPage,exploring]);
  const personal = !exploring && preferences.authenticated && course === preferences.courseSlug && semester === preferences.semester && !!parentUniversity(selected,UNIVERSITIES);
  function toggleSave(slug: string) {
    const key = subjectKey(slug);
    const next = saved.includes(key) ? saved.filter((item) => item !== key) : [...saved, key];
    setSaved(next); try { localStorage.setItem("neopathshala-saved-subjects", JSON.stringify(next)); } catch {}
  }
  function reset() { setFilter("all"); browse(preferences.courseSlug || "csit", preferences.semester || 1); }
  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <aside className="order-first min-w-0 self-start rounded-2xl border border-border bg-card lg:order-last lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-112px)] lg:min-h-0 lg:flex-col lg:overflow-hidden"><button type="button" aria-expanded={mobileFilters} aria-controls="library-filters" onClick={() => setMobileFilters(!mobileFilters)} className="flex w-full shrink-0 items-center justify-between gap-3 px-5 py-4 text-sm font-medium lg:pointer-events-none lg:cursor-default"><span className="flex items-center gap-2"><SlidersHorizontal size={16} className="text-muted-foreground" />Study preferences</span><span className="text-xs text-muted-foreground lg:hidden">{mobileFilters ? "Hide" : "Change"}</span></button><div id="library-filters" className={cn("min-h-0 space-y-5 border-t border-border p-5 lg:overflow-y-auto lg:overscroll-contain [scrollbar-width:thin]", !mobileFilters && "hidden lg:block")}><div><label htmlFor="library-university" className="mb-2 block text-xs font-medium">University</label><Select id="library-university" disabled={courseLocked||exploring&&!allowCourseSwitching} value={university} onChange={(event) => browse(course, semester, event.target.value)}>{!university&&<option value="">{selected?.university||"University unavailable"}</option>}{UNIVERSITIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div><div><label htmlFor="library-course" className="mb-2 block text-xs font-medium">Course</label><Select id="library-course" disabled={courseLocked||exploring&&!allowCourseSwitching} value={course} onChange={(event) => browse(event.target.value, semester)}>{Object.values(ACADEMIC_COURSES).map((item) => <option key={item.slug} value={item.slug}>{item.shortName}</option>)}</Select></div>{courseLocked&&<p className="text-xs leading-5 text-muted-foreground">Course and university follow your enrollment.</p>}<div><p id="library-semester-label" className="mb-3 text-xs font-medium">{periodName(selected)==='year'?'Year':'Semester'}</p><div role="group" aria-labelledby="library-semester-label" className="grid grid-cols-4 gap-2">{Array.from({ length: (selected?.totalSemesters || 0) }, (_, index) => index + 1).map((number) => <button key={number} type="button" aria-pressed={semester === number} onClick={() => browse(course, number)} className={cn("h-10 rounded-lg border text-xs font-medium transition-colors", semester === number ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50")}>{selected?.studySystem==='year'?semesterLabel(number,selected):number}</button>)}</div></div>{!exploring&&<div className="border-t border-border pt-4"><Button variant="ghost" className="h-auto px-0 text-xs" onClick={reset}><RotateCcw size={13} className="mr-2" />{preferences.authenticated ? "Return to my profile defaults" : "Reset selection"}</Button></div>}</div></aside>
      <div className="min-w-0 space-y-5"><section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/8 p-3 text-primary"><GraduationCap size={23} strokeWidth={1.5} /></span><div><div className="mb-1.5 flex flex-wrap items-center gap-2"><span className={exploring?"text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground":"eyebrow"}>{parentUniversity(selected,UNIVERSITIES)?.name || selected?.university || "University"}</span>{personal && <span className="flex items-center gap-1 text-[10px] font-medium text-primary"><Check size={11} />From your profile</span>}</div><h2 className="text-lg font-semibold tracking-tight">{(selected?.shortName || "courses")} <span className="mx-1 text-muted-foreground">/</span> {semesterLabel(semester,selected)}</h2></div></div><div className="flex flex-wrap items-center gap-5 sm:gap-6"><div className="flex gap-5 text-xs"><div><span className="block text-lg font-semibold">{semesterTotals.subjectCount}</span><span className="mt-1 block text-[10px] text-muted-foreground">Subjects</span></div><div><span className="block text-lg font-semibold">{semesterTotals.creditHours || "—"}</span><span className="mt-1 block text-[10px] text-muted-foreground">Credit hours</span></div></div>{!exploring&&<Button asChild variant="outline"><Link href="/student/profile?tab=details"><Settings2 size={15} className="mr-2"/>Academic settings</Link></Button>}</div></section>

        <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input aria-label="Search subjects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects by name or code" className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm" /></div><div className="flex rounded-lg border border-border bg-card p-1">{[{ id: "grid", icon: Grid2X2 }, { id: "list", icon: List }].map((item) => <button key={item.id} type="button" aria-label={`${item.id} view`} aria-pressed={view === item.id} onClick={() => setView(item.id)} className={cn("rounded-md p-1.5", view === item.id ? "bg-muted text-foreground" : "text-muted-foreground")}><item.icon size={16} /></button>)}</div></div>
        {!exploring&&<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div className="flex flex-wrap gap-1">{[{ id: "all", label: "All subjects" }, { id: "core", label: "Core" }, { id: "electives", label: "Electives" }, { id: "saved", label: "Saved" }].map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={cn("rounded-lg px-3 py-2 text-xs", filter === item.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50")}>{item.label}</button>)}</div><span className="text-xs text-muted-foreground">{filtered.length} subjects</span></div>}
        {!exploring && filter === "electives" && availableElectives.length > 0 && course === "csit" && semester === 8 && <p className="text-xs leading-6 text-muted-foreground">Choose one subject from Elective IV and one from Elective V.</p>}
        {!exploring && selectionMessage && <p role={selectionError ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-xs leading-6", selectionError ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary")}>{selectionMessage}</p>}
        {browsing ? <ResourcesResultsSkeleton exploring={exploring} filter={filter} view={view} /> : <div aria-busy={selecting} className={cn("grid gap-4", view === "grid" && "xl:grid-cols-2")}>
{filtered.map((subject) => {
          const href = `/${course}/${periodSlug(semester,selected)}/${subject.slug}`;
          return <ResourceSubjectCard exploring={exploring} key={subject.slug} subject={subject} href={href} stats={course === "csit" ? studyStats[resolveSubjectRoute(course,semester,subject.slug)?.contentSlug || subject.slug] || EMPTY_SUBJECT_STATS : EMPTY_SUBJECT_STATS} saved={saved.includes(subjectKey(subject.slug))} electivesTab={filter === "electives"} selected={selectedForPage.includes(subject.slug)} authenticated={preferences.authenticated} selecting={selecting} onToggleSave={() => toggleSave(subject.slug)} onSelect={() => selectElective(subject.slug)}/>;
        })}</div>}{!browsing && !filtered.length && <div className="rounded-xl border border-dashed border-border bg-card px-5 py-14 text-center"><BookOpen size={30} strokeWidth={1.5} className="mx-auto mb-4 text-muted-foreground" /><h3 className="text-sm font-medium">{subjects.length ? "No subjects match your filters" : "Materials aren’t available for this selection yet"}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{subjects.length ? "Try another name, or clear your search and filters." : "Choose another university, course, or study period to browse published curriculum."}</p><Button variant="outline" className="mt-5" onClick={() => { setQuery(""); setFilter("all"); if (!subjects.length) reset(); }}>{subjects.length ? "Clear filters" : "Return to my selection"}</Button></div>}
        
      </div>
    </div>
  </div>;
}
