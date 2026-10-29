import { getCurriculumSubjects, type CourseSubject } from "./multi-course-data";
import { SEMESTERS } from "./resources";

export function electiveSubjects(course: string, semester: number): (CourseSubject & { electiveGroup?: string })[] {
  if (course !== "csit") return getCurriculumSubjects(course, semester).filter(subject => subject.isElective);
  return (SEMESTERS.find(item => item.id === semester)?.subjects || []).filter(subject => subject.isElective).map(subject => ({ name: subject.name, slug: subject.slug, code: subject.code || getCurriculumSubjects(course, semester).find(item => item.slug === subject.slug)?.code || "", electiveGroup: subject.electiveGroup || undefined, isElective: true, pastQuestionsCount: 0 }));
}
export function studentSubjects(course: string, semester: number, selected: string[]) {
  const electives = electiveSubjects(course, semester);
  const electiveSlugs = new Set(electives.map(subject => subject.slug));
  return [...getCurriculumSubjects(course, semester).filter(subject => !subject.isElective && !electiveSlugs.has(subject.slug)), ...electives.filter(subject => selected.includes(subject.slug))];
}
