import {comingSoonCourseIds} from './course-availability.server';
import {coursesComingSoon} from './course-availability';
import { publicQuestions } from "./public-questions";
import { ACADEMIC_COURSES } from "./courses-meta";
import { getCurriculumSubjects } from "./multi-course-data";
import { resolveSubjectRoute } from "./subject-route";
import { SEMESTERS } from "./resources";
import { PDF_DOCUMENTS_DATABASE, PYQ_DATABASE } from "@/data/courses-db";
import { semesterLabel } from "./semester-label";
import { searchRecords, type SearchRecord } from "./search-records";
import { db } from "./db";
const records: SearchRecord[] = [];
const locations = new Map<string, { href: string; detail: string }>();
for (const course of Object.values(ACADEMIC_COURSES)) {
  for (let semester = 1; semester <= course.totalSemesters; semester++) {
    for (const subject of getCurriculumSubjects(course.slug, semester)) {
      const href = `/${course.slug}/sem-${semester}/${subject.slug}`;
      const detail = `${course.shortName} · ${semesterLabel(semester)} · ${subject.code || ""}`;
      records.push({ id: `subject:${course.slug}:${subject.slug}`, label: subject.name, href, detail, kind: "Subject", keywords: subject.description });
      const location = { href, detail: `${subject.name} · ${detail}` };
      if (!locations.has(subject.slug) || course.slug === "csit") locations.set(subject.slug, location);
      const contentSlug = resolveSubjectRoute(course.slug, semester, subject.slug)?.contentSlug;
      if (contentSlug && (!locations.has(contentSlug) || course.slug === "csit")) locations.set(contentSlug, location);
    }
  }
}
function locationFor(slug: string) {
  return locations.get(slug) || { href: `/subject/${encodeURIComponent(slug)}`, detail: "Study resources" };
}
for (const semester of SEMESTERS) for (const subject of semester.subjects) {
  const location = locationFor(subject.slug);
  for (const resource of subject.resources) records.push({ id: `resource:${resource.id}`, label: resource.title, href: `${location.href}?tab=${resource.type === "papers" ? "pyqs" : resource.type === "syllabus" ? "syllabus" : "notes"}`, kind: "Resource", detail: location.detail });
}
for (const doc of PDF_DOCUMENTS_DATABASE) {
  const location = locationFor(doc.subjectSlug);
  records.push({ id: `pdf:${doc.id}`, label: doc.title, href: `${location.href}?tab=${doc.type === "papers" ? "pyqs" : doc.type === "books" ? "textbooks" : doc.type === "syllabus" ? "syllabus" : "notes"}`, kind: "Resource", detail: location.detail, keywords: doc.author });
}
for (const question of PYQ_DATABASE) {
  const location = locationFor(question.subjectSlug);
  records.push({ id: `question:${question.id}`, label: question.questionText, href: `${location.href}?tab=pyqs#question-${encodeURIComponent(question.id)}`, kind: "Question", detail: `${location.detail} · ${question.year} BS`, keywords: question.unitName });
}
const settings: SearchRecord[] = [
  { id: "settings:details", label: "Profile settings", href: "/student/profile?tab=details", kind: "Settings", detail: "Name, phone, profile photo, course and semester", keywords: "account avatar university" },
  { id: "settings:electives", label: "Change elective subjects", href: "/student/profile?tab=details#profile-electives", kind: "Settings", detail: "Update your selected elective subjects" },
  { id: "settings:security", label: "Security & devices", href: "/student/profile?tab=security", kind: "Settings", detail: "Sign-in sessions, devices and recent account activity", keywords: "password login logout" },
];
export async function globalSearch(query: string) {
  if(coursesComingSoon)return {results:searchRecords(settings,query),partial:false};
  const index = [...records, ...settings];
  const unavailable=await comingSoonCourseIds();
  let partial = false;
  const [uploaded, important] = await Promise.allSettled([
    db.resource.findMany({ where: { status:'PUBLISHED',subject:{status:'PUBLISHED',course:{status:'PUBLISHED',id:{notIn:unavailable}}}, OR: [{ title: { contains: query, mode: "insensitive" } }, { subject: { name: { contains: query, mode: "insensitive" } } }] }, select: { id: true, title: true, type: true, subject: { select: { slug: true, name: true } } }, take: 30, orderBy: { createdAt: "desc" } }),
    publicQuestions(),
  ]);
  if (uploaded.status === "fulfilled") for (const resource of uploaded.value) {
    const location = locationFor(resource.subject.slug);
    index.push({ id: `uploaded:${resource.id}`, label: resource.title, kind: "Resource", href: `${location.href}?tab=${resource.type === "papers" ? "pyqs" : resource.type === "syllabus" ? "syllabus" : "notes"}`, detail: location.detail });
  } else partial = true;
  if (important.status === "fulfilled") {
    partial ||= important.value.partial;
    for (const question of important.value.questions) {
      const location = locationFor(question.subjectSlug);
      index.push({ id: `important:${question.id}`, label: question.questionText, href: `${location.href}/important-questions#question-${encodeURIComponent(question.id)}`, kind: "Question", detail: `${location.detail} · Important questions`, keywords: question.unitName });
    }
  } else partial = true;
  return { results: searchRecords(index, query), partial };
}
