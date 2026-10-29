import { electiveSubjects } from "./student-subjects";
import { semesterLabel } from "./semester-label";

export function accountActivityMessage(action: string, details: string): string {
  if (action === "academic.electives_updated") {
    try {
      const saved = JSON.parse(details);
      if (typeof saved.course !== "string" || !Number.isInteger(saved.semester) || !Array.isArray(saved.electives)) return "Academic preferences updated.";
      const names = electiveSubjects(saved.course, saved.semester).filter(subject => saved.electives.includes(subject.slug)).map(subject => subject.name);
      return names.length ? `${semesterLabel(saved.semester)} electives updated: ${names.join(", ")}.` : "Academic preferences updated.";
    } catch { return "Academic preferences updated."; }
  }
  if (/^\s*[\[{]/.test(details)) return "Account settings updated.";
  return details;
}
