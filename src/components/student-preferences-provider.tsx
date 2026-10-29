"use client";
import {periodSlug} from "@/lib/academic-structure";
import {parentUniversity} from "@/lib/resource-selection";
import { useCatalog } from "@/components/catalog-provider";
import { createContext, useContext, useEffect, useMemo, useState } from "react";


export type StudentDefaults = { authenticated: boolean; courseSlug: string | null; semester: number | null };
const fallback: StudentDefaults = { authenticated: false, courseSlug: null, semester: null };
const Context = createContext(fallback);
export function StudentPreferencesProvider({ preferences, children }: { preferences: StudentDefaults; children: React.ReactNode }) {
  const { resolveStudentCourse, UNIVERSITIES } = useCatalog();
  const [device, setDevice] = useState<StudentDefaults>(fallback);
  useEffect(() => {
    try {
      if (preferences.authenticated) {
        if (preferences.courseSlug) localStorage.setItem("neopathshala_selected_course", preferences.courseSlug === "csit" ? "csit" : preferences.courseSlug);
        else localStorage.removeItem("neopathshala_selected_course");
        if (preferences.semester) { localStorage.setItem("neopathshala_selected_semester", String(preferences.semester)); localStorage.setItem("neopathshala_user_semester", String(preferences.semester)); }
        else { localStorage.removeItem("neopathshala_selected_semester"); localStorage.removeItem("neopathshala_user_semester"); }
        const university=parentUniversity(resolveStudentCourse(preferences.courseSlug||"")||undefined,UNIVERSITIES);
        if(university)localStorage.setItem("neopathshala_selected_university",university.id);else localStorage.removeItem("neopathshala_selected_university");
      } else {
        const course = resolveStudentCourse(localStorage.getItem("neopathshala_selected_course") || "");
        const semester = Number(localStorage.getItem("neopathshala_selected_semester"));
        setDevice({ authenticated: false, courseSlug: course?.slug || null, semester: Number.isInteger(semester) && semester >= 1 && semester <= 8 ? semester : null });
      }
    } catch {}
  }, [preferences.authenticated, preferences.courseSlug, preferences.semester]);
  const value = useMemo(() => preferences.authenticated ? preferences : device, [preferences, device]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStudentPreferences() {
  const defaults = useContext(Context);
  const {getCourseBySlug}=useCatalog();
  const ready = !!defaults.courseSlug && !!defaults.semester;
  return {
    ...defaults,
    resourceHref: ready ? `/resources?course=${defaults.courseSlug}&semester=${defaults.semester}` : defaults.authenticated ? "/student/profile?tab=details" : "/resources",
    semesterHref: ready ? `/${defaults.courseSlug}/${periodSlug(defaults.semester!,getCourseBySlug(defaults.courseSlug||""))}` : defaults.authenticated ? "/student/profile?tab=details" : "/courses",
    courseHref: defaults.courseSlug ? `/${defaults.courseSlug}` : "/courses",
    noticesHref: "/notices",
  };
}
