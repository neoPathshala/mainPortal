"use client";
import {periodSlug,periodName} from "@/lib/academic-structure";
import { StickySidebar } from "@/components/layout/StickySidebar";
import { HomepageBanners } from "./HomepageBanners";
import type { HomepageBanner } from "@/lib/homepage-banners";
import { NeoCodeBaseCard } from "@/components/neocodebase-card";
import { ComingSoon } from "@/components/courses/ComingSoon";
import { useCatalog } from "@/components/catalog-provider";
import { RELEASE_FEATURES } from "@/lib/release-features";
import { ENTRANCE_PORTAL_URL } from "@/lib/entrance-portal";
import { semesterLabel } from "@/lib/semester-label";
import { useStudentPreferences } from "@/components/student-preferences-provider";
import { Select } from "@/components/ui/select";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";

const tools = [
  {
    title: "Notes & resources",
    description: "Chapter notes and study materials.",
    icon: BookOpen,
    href: "/resources",
    color:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-primary",
  },
  {
    title: "Past questions",
    description: "Know what to expect on exam day.",
    icon: FileText,
    href: "/csit/sem-1",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    title: "Entrance preparation",
    description: "Timed mock exams and practice sets.",
    icon: Timer,
    href: ENTRANCE_PORTAL_URL,
    color:
      "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  {
    title: "Syllabus & units",
    description: "Curriculum outlines and subject units.",
    icon: Layers,
    href: "/courses",
    color:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
];

export function StudyDashboard({
  banners = [],
}: {
  banners?: HomepageBanner[];
}) {
  const { ACADEMIC_COURSES, UNIVERSITIES } = useCatalog();
  const courses = Object.values(ACADEMIC_COURSES);
  const preferences = useStudentPreferences();
  const [course, setCourse] = useState(preferences.courseSlug || "csit");
  const [semester, setSemester] = useState(preferences.semester || 1);
  useEffect(() => {
    if (preferences.courseSlug) setCourse(preferences.courseSlug);
    if (preferences.semester) setSemester(preferences.semester);
  }, [preferences.courseSlug, preferences.semester]);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("neopathshala-saved-courses") || "[]",
      );
      if (Array.isArray(value))
        setSaved(
          value.filter((item): item is string => typeof item === "string"),
        );
    } catch {}
  }, []);
  function toggleSaved(slug: string) {
    const next = saved.includes(slug)
      ? saved.filter((item) => item !== slug)
      : [...saved, slug];
    setSaved(next);
    try {
      localStorage.setItem("neopathshala-saved-courses", JSON.stringify(next));
    } catch {}
  }
  const selected =
    ACADEMIC_COURSES[course] || Object.values(ACADEMIC_COURSES)[0];
  const filtered = courses.filter(
    (item) =>
      `${item.name} ${item.shortName}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!savedOnly || saved.includes(item.slug)),
  );
  const studyHref = selected
    ? `/${selected.slug}/${periodSlug(semester,selected)}`
    : "/courses";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Your space to learn, grow, and get ahead
        </div>
        <Link
          href="/student"
          className="flex items-center gap-1.5 font-medium hover:text-primary"
        >
          My workspace <ArrowRight size={14} />
        </Link>
      </div>
      <ComingSoon disabled={selected?.comingSoon}>
        <section className="grid gap-8 rounded-3xl border border-border bg-card p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:p-12">
          <div className="flex flex-col justify-center">
            <span className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              The student desk
            </span>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]">
              Your {periodName(selected)}.
              <br />
              <span className="text-primary">All in one place.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              Notes, past questions, and practice. Find your course, choose a
              {periodName(selected)}, and get straight to the material.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={studyHref}>
                  Start learning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/resources?course=${course}&semester=${semester}`}>
                  Explore resources
                </Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Check size={14} className="text-primary" /> Free resources ·
              Built for students in Nepal
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl border border-border bg-card p-2.5 text-primary">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">
                  Where are you in your journey?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Find the materials that matter to you.
                </p>
              </div>
            </div>
            <label
              htmlFor="study-course"
              className="mb-2 block text-xs font-medium"
            >
              Your course
            </label>
            <Select
              id="study-course"
              value={course}
              onChange={(event) => {
                setCourse(event.target.value);
                setSemester(1);
              }}
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              {courses.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.shortName}
                </option>
              ))}
            </Select>
            <p className="mb-3 mt-5 text-xs font-medium" id="semester-label">
              Your {periodName(selected)}
            </p>
            <div
              role="group"
              aria-labelledby="semester-label"
              className="grid grid-cols-4 gap-2"
            >
              {Array.from(
                { length: selected?.totalSemesters || 0 },
                (_, index) => index + 1,
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={semester === value}
                  onClick={() => setSemester(value)}
                  className={cn(
                    "h-10 rounded-lg border text-sm transition-colors",
                    semester === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {selected?.studySystem==='year'?semesterLabel(value,selected):value}
                </button>
              ))}
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href={studyHref}>
                Open {selected?.shortName || "courses"} ·{" "}
                {semesterLabel(semester,selected)}
                <ArrowRight size={15} className="ml-auto" />
              </Link>
            </Button>
          </div>
        </section>
      </ComingSoon>

      <NeoCodeBaseCard />
      <HomepageBanners banners={banners} slot="middle" />
      <section className="py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            The study toolkit
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) =>
            selected?.comingSoon && tool.title !== "Entrance preparation" ? (
              <ComingSoon key={tool.title}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <tool.icon size={20} />
                  <h3 className="mt-5 text-sm font-semibold">{tool.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </ComingSoon>
            ) : (
              <Link
                key={tool.title}
                href={tool.href}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className={cn("rounded-lg p-2.5", tool.color)}>
                    <tool.icon size={20} />
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground transition-transform group-hover:translate-x-1"
                  />
                </div>
                <h3 className="text-sm font-semibold">{tool.title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {tool.description}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>

      <div className="grid items-stretch gap-8 lg:grid-cols-[1fr_320px]">
        <section id="courses" className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Find your course
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {courses.length} courses available · One place for your studies.
              </p>
            </div>

          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-48 flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
              />
              <input
                aria-label="Search courses"
                placeholder="Search your course…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground"
              />
            </div>
            <Button
              variant={savedOnly ? "secondary" : "outline"}
              onClick={() => setSavedOnly(!savedOnly)}
              aria-pressed={savedOnly}
            >
              <Bookmark size={14} className="mr-2" />
              Saved ({saved.length})
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((item) => (
              <ComingSoon disabled={item.comingSoon} key={item.slug}>
                <Card className="group transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-sm text-muted-foreground">
                        {String(courses.indexOf(item) + 1).padStart(2, "0")}
                      </span>
                      <Link href={`/${item.slug}`} className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                          {item.shortName}
                        </h3>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleSaved(item.slug)}
                        aria-label={`${saved.includes(item.slug) ? "Unsave" : "Save"} ${item.shortName}`}
                        aria-pressed={saved.includes(item.slug)}
                        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Bookmark
                          size={17}
                          className={
                            saved.includes(item.slug)
                              ? "fill-primary text-primary"
                              : ""
                          }
                        />
                      </button>
                    </div>
                    <Link href={`/${item.slug}`} className="block">
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.name}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          {item.totalSemesters} {periodName(item,true)} ·{" "}
                          {UNIVERSITIES.find(
                            (university) => university.name === item.university,
                          )?.shortName || item.university}
                        </span>
                        <ChevronRight size={16} className="text-primary" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </ComingSoon>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <BookOpen className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm">
                {savedOnly
                  ? "No saved courses match your search."
                  : "No courses found. Try another name."}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setQuery("");
                  setSavedOnly(false);
                }}
              >
                Clear course filters
              </Button>
            </div>
          )}
        </section>
        <StickySidebar className="space-y-5">
          <HomepageBanners banners={banners} slot="sidebar" />
          <Card className="border-primary/15 bg-primary/5">
            <CardContent className="p-5">
              <span className="mb-4 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                <Timer size={20} />
              </span>
              <h2 className="text-base font-semibold">
                Ready for a challenge?
              </h2>
              <p className="mb-5 mt-2 text-xs leading-6 text-muted-foreground">
                Put your preparation to the test with timed practice and mock
                exams.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={ENTRANCE_PORTAL_URL}>
                  Open entrance portal{" "}
                  <ArrowRight size={14} className="ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Link
            href="/contribute-assets"
            className="group block rounded-2xl border border-primary/20 bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <BookOpen size={21} strokeWidth={1.5} />
              </span>
            </div>
            <h3 className="text-base font-semibold tracking-tight">
              Good notes deserve to be shared.
            </h3>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Help another student. Contribute your notes, study diagrams, or
              past papers.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary">
              Contribute a resource
              <ArrowRight size={13} />
            </span>
          </Link>
        </StickySidebar>
      </div>
      <div className="mt-8">
        <HomepageBanners banners={banners} slot="bottom" />
      </div>
      {RELEASE_FEATURES.subscriptions && (
        <section className="mt-12 flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles size={16} />A little extra, when you need it
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Go deeper with neoPathshala Pro.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore premium notes and study materials for your next exam.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/subscriptions">
              Explore Pro <ArrowRight className="ml-3" size={15} />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
