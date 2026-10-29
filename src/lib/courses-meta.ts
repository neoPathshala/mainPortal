// ═══════════════════════════════════════════════════════════════════════════════
// neoPathshala Academic Programs & SEO Canonical URL Mappings
// High-ranking SEO titles, descriptions, and keywords for Nepali universities
// ═══════════════════════════════════════════════════════════════════════════════

export interface AcademicCourse {
  comingSoon?: boolean;
  studySystem?: import("./academic-structure").StudySystem;
  slug: string;
  name: string;
  shortName: string;
  university: string;
  faculty: string;
  facultySlug?: string;
  totalSemesters: number;
  totalCredits: number;
  tagline: string;
  description: string;
  seoKeywords: string[];
}

export const ACADEMIC_COURSES: Record<string,AcademicCourse> = {};

/**
 * Normalizes semester slug strings like:
 * "semester-1" -> 1
 * "1st-semester" -> 1
 * "1" -> 1
 * "sem-2" -> 2
 */
export function parseSemesterSlug(semesterSlug: string): number | null {
  if (!semesterSlug) return null;
  const match = semesterSlug.match(/(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 1 || num > 8) return null;
  return num;
}

/**
 * Generates canonical SEO slug for a semester
 */
export function formatSemesterSlug(semId: number): string {
  return `sem-${semId}`;
}

/**
 * Gets a course by its canonical slug while accepting the retired CSIT slug.
 */
export function getCourseBySlug(slug: string): AcademicCourse | undefined {
  const normalized = slug.toLowerCase().replace(/_/g, "-");
  return ACADEMIC_COURSES[normalized === "bsc-csit" ? "csit" : normalized];
}
