import { resolveStudentCourse } from "./student-preferences";
import { electiveSubjects } from "./student-subjects";
import { electiveSelectionError } from "./elective-policy";

export function registrationAcademics(courseValue: unknown, semester: unknown, electives: unknown = []) {
  const course = typeof courseValue === "string" && courseValue.length <= 150 ? resolveStudentCourse(courseValue) : null;
  if (!course) return { valid: false as const, message: "Choose your course." };
  if (typeof semester !== "number" || !Number.isInteger(semester) || semester < 1 || semester > course.totalSemesters) return { valid: false as const, message: "Choose a semester from your course." };
  if (!Array.isArray(electives) || electives.length > 20 || electives.some(value => typeof value !== "string")) return { valid: false as const, message: "Choose valid elective subjects." };
  // Electives may be skipped at signup. A nonempty selection follows the course rules.
  const error = electives.length ? electiveSelectionError(course.slug, semester, electives, electiveSubjects(course.slug, semester)) : null;
  if (error) return { valid: false as const, message: error };
  return { valid: true as const, course, semester, electives: electives as string[] };
}
