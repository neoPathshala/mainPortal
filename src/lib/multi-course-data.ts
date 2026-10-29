// ═══════════════════════════════════════════════════════════════════════════════
// neoPathshala Multi-Course & University Academic Curriculum Engine
// Supports Tribhuvan University (TU), Pokhara University (PU), Purbanchal University, etc.
// Programs: B.Sc. CSIT, BCA, BIT, BIM, BBM, BBA, IOE Computer, B.Sc. Physical
// ═══════════════════════════════════════════════════════════════════════════════

export interface CourseSubject {
  name: string;
  code: string;
  slug: string;
  pastQuestionsCount: number;
  creditHours?: number;
  isElective?: boolean;
  description?: string;
}

export interface UniversityOption {
  id: string;
  name: string;
  shortName: string;
}

export interface CourseOption {
  studySystem?:import("./academic-structure").StudySystem;
  id: string;
  slug: string;
  name: string;
  shortName: string;
  faculty: string;
  totalSemesters: number;
  defaultUniversity: string;
}

export const UNIVERSITIES: UniversityOption[] = [];
export const COURSES: CourseOption[] = [];
export const COURSE_CURRICULUM: Record<string,Record<number,CourseSubject[]>> = {};

/**
 * Normalizes course aliases, including the retired "bsc-csit" slug.
 */
export function normalizeCourseId(courseIdOrSlug?: string): string {
  if (!courseIdOrSlug) return courseIdOrSlug?.trim().toLowerCase() || "";
  const lower = courseIdOrSlug.toLowerCase().trim().replace(/_/g, "-");
  if (lower === "bsc-csit" || lower === "csit" || lower === "tu-csit") return courseIdOrSlug?.trim().toLowerCase() || "";
  if (lower === "bca" || lower === "tu-bca") return "bca";
  if (lower === "bit" || lower === "tu-bit") return "bit";
  if (lower === "bim" || lower === "tu-bim") return "bim";
  if (lower === "bbm" || lower === "tu-bbm") return "bbm";
  if (lower === "bba" || lower === "tu-bba") return "bba";
  if (lower === "ioe" || lower === "ioe-computer" || lower === "computer-engineering") return "ioe";
  if (lower === "bsc" || lower === "bsc-physics" || lower === "physical") return "bsc";
  return courseIdOrSlug?.trim().toLowerCase() || "";
}

/**
 * Get course meta object
 */
export function getCourseOption(courseIdOrSlug: string): CourseOption {
  const norm = normalizeCourseId(courseIdOrSlug);
  return COURSES.find((c) => c.id === norm) || COURSES[0];
}

/**
 * Get university meta object
 */
export function getUniversityOption(univId?: string): UniversityOption {
  if (!univId) return UNIVERSITIES[0];
  const norm = univId.toLowerCase().trim().replace(/_/g, "-");
  return UNIVERSITIES.find((u) => u.id === norm) || UNIVERSITIES[0];
}

/**
 * Get subjects for a given university, course, and semester
 */
export function getCurriculumSubjects(
  courseIdOrSlug: string,
  semester: number = 1
): CourseSubject[] {
  const norm = normalizeCourseId(courseIdOrSlug);
  const courseData = COURSE_CURRICULUM[norm];
  if (!courseData) {
    return [];
  }
  const semSubjects = courseData[semester];
  if (semSubjects && semSubjects.length > 0) {
    return semSubjects;
  }
  // Fallback to semester 1 of that course
  return [];
}
