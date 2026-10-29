import { ACADEMIC_COURSES } from "./courses-meta";
export function resolveStudentCourse(value: string) {
  const normalized = value.trim().toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  return Object.values(ACADEMIC_COURSES).find((course) => normalized === course.slug || normalized === course.shortName.toLowerCase() || normalized === course.name.toLowerCase())
    || Object.values(ACADEMIC_COURSES).find((course) => course.slug === "csit" ? compact.includes("csit") : normalized.split(/[^a-z0-9]+/).includes(course.slug)) || null;
}
export function studentResourceHref(course: string, semester: number | null) {
  const selected = resolveStudentCourse(course);
  return selected && semester ? `/resources?course=${selected.slug}&semester=${semester}` : "/student/profile?tab=details";
}
