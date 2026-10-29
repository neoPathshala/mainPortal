"use client";
import {periodSlug,periodName} from "@/lib/academic-structure";
import { useCatalog } from "@/components/catalog-provider";

import { semesterLabel } from "@/lib/semester-label";
import Link from "next/link";
import { ArrowRight, Bell, BookOpen, ChevronRight, GraduationCap, Layers, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
import { SubjectIcon } from "@/components/ui/SubjectIcon";


import { noticesForSemester, type SemesterNotice } from "@/lib/semester-notices";
import { SemesterNotices } from "./SemesterNotices";

type Props = {
  profile: { electives: string[]; name: string; email: string; phone: string; course: string; semester: number | null; joined: string; lastLogin: string | null };
  avatarUrl: string | null;
  sessions: { id: string; device: string; lastActive: string }[];
  currentSessionId: string;
  activity: { id: string; details: string; createdAt: string }[];
  notices: SemesterNotice[];
};
export function ProfileOverview({ profile, avatarUrl, notices }: Props) {
  const { studentSubjects, resolveStudentCourse, studentResourceHref } = useCatalog();
  const course = resolveStudentCourse(profile.course);
  const ready = !!course && !!profile.semester;
  const subjects = ready ? studentSubjects(course!.slug, profile.semester!, profile.electives) : [];
  const relevantNotices = noticesForSemester(notices, profile.semester,course?.slug);
  const studyHref = studentResourceHref(profile.course, profile.semester);
  return <div className="space-y-5">
    <section className="rounded-xl border border-border bg-muted/25 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><ProfileAvatar url={avatarUrl} name={profile.name} /><div><p className="eyebrow mb-1">Your academic profile</p><h2 className="text-lg font-semibold tracking-tight">{ready ? `${course!.shortName} · ${semesterLabel(profile.semester!,course!)}` : "Set up your student workspace"}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">{ready ? course!.university : "Choose a course and semester to see your own subjects and materials."}</p></div></div><Button asChild variant="outline" size="sm"><Link href="/student/profile?tab=details"><Settings2 size={14} className="mr-2" />Academic settings</Link></Button></div></section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[{ title: "My subjects", value: ready ? String(subjects.length).padStart(2, "0") : "—", icon: BookOpen }, { title: course?.studySystem==='year'?"My year":"My semester", value: profile.semester ? semesterLabel(profile.semester!,course!).replace(" Semester", "") : "—", icon: Layers }, { title: "Relevant notices", value: String(relevantNotices.length).padStart(2, "0"), icon: Bell }].map((item) => <div key={item.title} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between text-muted-foreground"><span className="text-xs">{item.title}</span><item.icon size={15} /></div><p className="mt-3 text-2xl font-semibold tracking-tight">{item.value}</p></div>)}</div>
    <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border"><div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">My {periodName(course||undefined)} subjects</h2><p className="mt-1 text-[11px] text-muted-foreground">Notes, past questions, syllabus, and available study material.</p></div>{ready && <Link href={`/${course!.slug}/${periodSlug(profile.semester!,course!)}`} className="shrink-0 text-xs text-primary">View {periodName(course||undefined)} →</Link>}</div>{subjects.length ? <div className="flex flex-1 flex-col divide-y divide-border">{subjects.map((subject) => <Link key={subject.slug} href={`/${course!.slug}/${periodSlug(profile.semester!,course!)}/${subject.slug}`} className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"><span className="rounded-lg bg-muted p-2.5 text-primary"><SubjectIcon name={subject.name} className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium group-hover:text-primary">{subject.name}{subject.isElective && <span className="ml-2 text-[10px] font-normal text-primary">Elective</span>}</h3><p className="mt-1 text-[10px] text-muted-foreground">{subject.code}{subject.creditHours ? ` · ${subject.creditHours} credit hours` : ""}</p></div><ChevronRight size={16} className="shrink-0 text-muted-foreground" /></Link>)}</div> : <div className="px-5 py-10 text-center"><GraduationCap size={27} className="mx-auto mb-4 text-muted-foreground" /><p className="text-sm font-medium">{ready ? "Subjects haven’t been added yet" : "Your subjects will appear here"}</p><p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{ready ? "We’ll show materials for your chosen semester when they’re published." : "Save your course and current semester in profile settings. We’ll select the relevant subjects automatically."}</p><Button asChild variant="outline" className="mt-5"><Link href="/student/profile?tab=details">Update academic settings<ArrowRight size={13} className="ml-2" /></Link></Button></div>}</section><div className="flex min-w-0 flex-col gap-5"><section className="rounded-xl border border-primary/15 bg-primary/5 p-5"><BookOpen size={21} strokeWidth={1.6} className="mb-4 text-primary" /><h2 className="text-sm font-semibold">Your study materials</h2><p className="mb-5 mt-2 text-xs leading-6 text-muted-foreground">{ready ? `Open the resource library with ${course!.shortName}, ${semesterLabel(profile.semester!,course!)} already selected.` : "Set your academic preferences once to open the right materials each time."}</p><Button asChild className="w-full"><Link href={studyHref}>{ready ? "Open my resources" : "Choose course & semester"}<ArrowRight size={14} className="ml-auto" /></Link></Button></section><section className="flex-1 rounded-xl border border-border p-5"><h2 className="mb-4 text-sm font-semibold">Student details</h2><dl className="space-y-4 text-xs"><div><dt className="text-muted-foreground">Student</dt><dd className="mt-1 font-medium">{profile.name}</dd></div><div><dt className="text-muted-foreground">Course</dt><dd className="mt-1 font-medium">{course ? `${course.shortName}${profile.semester ? ` (${semesterLabel(profile.semester!,course!)})` : ""}` : "Not selected"}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 break-all font-medium">{profile.email}</dd></div></dl></section></div></div>
    <SemesterNotices courseSlug={course?.slug} notices={notices} semester={profile.semester} compact />
  </div>;
}
