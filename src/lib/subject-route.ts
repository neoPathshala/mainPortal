import { getCourseBySlug } from "./courses-meta";
import { getCurriculumSubjects } from "./multi-course-data";
import { getSubject, type Subject } from "./resources";

// Catalogue URLs use full names; existing content and resource records may use
// older short slugs. Keep the public URL while loading the original content.
const csitAliases: Record<string, string> = {
  "introduction-to-information-technology": "iit",
  "object-oriented-programming": "oop-cpp",
  "data-structures-and-algorithms": "dsa",
  "database-management-systems": "dbms",
  "design-and-analysis-of-algorithms": "daa",
  "simulation-and-modeling": "simulation-modeling",
  "system-analysis-and-design": "system-analysis-design",
  "compiler-design-and-construction": "compiler-design",
  "advanced-java-programming": "advanced-java",
  "data-warehousing-and-data-mining": "dwdm",
  "project-work": "project-work-7th",
  "internship": "internship-8th",
  "network-and-system-administration": "network-sys-admin",
};

export function resolveSubjectRoute(courseSlug: string, semester: number, subjectSlug: string): { contentSlug: string; fallback?: Subject } | null {
  const course = getCourseBySlug(courseSlug);
  if (!course || !Number.isInteger(semester) || semester < 1 || semester > course.totalSemesters) return null;
  const contentSlug = course.slug === "csit" ? csitAliases[subjectSlug] || subjectSlug : subjectSlug;
  const stored = course.slug === "csit" ? getSubject(contentSlug) : undefined;
  const curriculum = getCurriculumSubjects(course.slug, semester).find(subject => subject.slug === subjectSlug);
  if (stored && stored.semester === semester) return { contentSlug, fallback: stored };
  if (curriculum) return { contentSlug: curriculum.slug, fallback: { ...curriculum, semester, description: curriculum.description || "", resources: [] } };
  // Still allow published database subjects not present in the static catalog.
  return { contentSlug: subjectSlug };
}
