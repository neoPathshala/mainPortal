import {periodSlug,periodName} from "@/lib/academic-structure";
import {courseUnavailable} from '@/lib/course-availability.server';
import {coursesComingSoon} from '@/lib/course-availability';
import {redirect as redirectUnavailableCourse} from 'next/navigation';
import {publishedCourseSyllabus} from "@/lib/course-syllabus.server";
import { getNavigationCatalog } from "@/lib/catalog.server";
import { semesterLabel } from "@/lib/semester-label";
import { getStudentDefaults } from "@/lib/security/student-defaults";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { BookOpen, Layers, ArrowRight, GraduationCap, FileDown } from "lucide-react";



interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { getCourseBySlug } = await getNavigationCatalog();
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return {
      title: "Course Not Found | neoPathshala",
    };
  }

  return {
    title: `${course.name} (${course.shortName}) TU Syllabus & Notes | neoPathshala`,
    description: `Official Tribhuvan University ${course.name} (${course.shortName}) curriculum. Access all ${course.totalSemesters} ${periodName(course,true)} syllabi, subject notes, past question papers, and solutions on neoPathshala.`,
    keywords: course.seoKeywords,
    openGraph: {
      title: `${course.name} - Complete TU Notes & Syllabus | neoPathshala`,
      description: course.description,
      siteName: "neoPathshala",
    },
    alternates: { canonical: `/${course.slug}` },
  };
}

export default async function CourseDetailPage({ params }: Props) {
 if(coursesComingSoon||await courseUnavailable((await params).courseSlug))redirectUnavailableCourse('/courses');
  const { getCourseBySlug, getCurriculumSubjects, getSemesterSummary } = await getNavigationCatalog();
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);
  if (!course) notFound();

  const [defaults,syllabus] = await Promise.all([getStudentDefaults(),publishedCourseSyllabus(course.slug)]);
  const currentSemester = defaults.courseSlug === course.slug && defaults.semester && defaults.semester <= course.totalSemesters ? defaults.semester : null;
  const semesters = Array.from({ length: course.totalSemesters }, (_, index) => {
    const number = index + 1;
    const subjects = getCurriculumSubjects(course.slug, number);
    return {
      number,
      summary:getSemesterSummary(course.slug,number),
      core: subjects.filter(subject => !subject.isElective).length,
      groups: [...new Set(subjects.filter(subject => subject.isElective).map(subject => subject.electiveGroup || "Electives"))].sort(),
    };
  });

  return <div className="page-shell !py-8 sm:!py-10">

    <header className="border-b border-border pb-8 sm:pb-10">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="min-w-0 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><GraduationCap size={18} strokeWidth={1.6} className="shrink-0 text-primary" aria-hidden="true" />{course.university}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{course.shortName}</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{course.name}</p>
        </div>
        <Button asChild className="h-10 shrink-0 self-start sm:self-auto"><Link href={`/${course.slug}/${periodSlug(currentSemester||1,course)}`}>
          {currentSemester ? `Continue ${semesterLabel(currentSemester,course)}` : `Explore ${semesterLabel(1,course)}`}<ArrowRight size={16} className="ml-3" aria-hidden="true" />
        </Link></Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Layers size={16} aria-hidden="true" /><span><span className="font-medium text-foreground">{course.totalSemesters}</span> {periodName(course,true)}</span></span>
        <span className="inline-flex items-center gap-2"><BookOpen size={16} aria-hidden="true" /><span><span className="font-medium text-foreground">{course.totalCredits}</span> credit hours</span></span>
      </div>
    </header>

    {syllabus && <section aria-label="Course syllabus" className="mt-6 flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="rounded-lg bg-primary/10 p-2.5 text-primary"><FileDown size={21} strokeWidth={1.6} aria-hidden="true"/></span><div><h2 className="text-base font-semibold">Course syllabus</h2><p className="mt-1 text-sm text-muted-foreground">The complete {course.shortName} syllabus, in one PDF.</p></div></div><a href={syllabus.href} className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-border px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5" download><FileDown size={16} aria-hidden="true"/>Download syllabus</a></section>}

    <section aria-labelledby="semesters-heading" className="pt-8">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="semesters-heading" className="text-xl font-semibold tracking-tight">Explore your {periodName(course,true)}</h2>
        <p className="text-sm text-muted-foreground">Choose a {periodName(course)} to find your subjects.</p>
      </div>
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-2">
        {Array.from({ length: Math.ceil(course.totalSemesters / (course.studySystem==='year'?1:2)) }, (_, year) => <section key={year} aria-labelledby={`year-${year + 1}`}>
          <div className="mb-3 flex items-center gap-3"><h3 id={`year-${year + 1}`} className="shrink-0 text-sm font-medium text-muted-foreground">Year {year + 1}</h3><div className="h-px flex-1 bg-border" aria-hidden="true" /></div>
          <div className="space-y-3">
            {semesters.slice(year * (course.studySystem==='year'?1:2), (year+1)*(course.studySystem==='year'?1:2)).map(semester => {
              const selected = semester.number === currentSemester;
              return <Link key={semester.number} href={`/${course.slug}/${periodSlug(semester.number,course)}`} aria-current={selected ? "step" : undefined} className={`group flex min-w-0 items-center gap-4 rounded-xl border bg-card p-4 transition-colors sm:p-5 ${selected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}>
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"}`}><BookOpen size={21} strokeWidth={1.6} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h4 className="text-base font-semibold tracking-tight">{semesterLabel(semester.number,course)}</h4>{selected && <span className="text-xs font-medium text-primary">My {periodName(course)}</span>}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-muted-foreground">{semester.summary.subjectCount} {semester.summary.subjectCount === 1 ? "subject" : "subjects"} · {semester.summary.creditHours} credits</span>
                    {semester.groups.map(group => <span key={group} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Layers size={13} aria-hidden="true" />{group.toUpperCase()}</span>)}
                  </div>
                </div>
                <ArrowRight size={17} className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
              </Link>;
            })}
          </div>
        </section>)}
      </div>
    </section>
  </div>;
}
