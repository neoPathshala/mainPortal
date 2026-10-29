export const STUDY_TABS = ["notes", "videos", "syllabus", "pyqs", "textbooks", "important", "discussions", "viva", "practical"] as const;
export type StudyTab = typeof STUDY_TABS[number];
export function normalizeStudyTab(value?: string | null): StudyTab {
  const tab = (value || "notes").toLowerCase();
  if (["questions", "past-questions", "solutions"].includes(tab)) return "pyqs";
  if (tab === "important-questions") return "important";
  if (tab === "marking-scheme") return "syllabus";
  if (tab === "lectures") return "videos";
  return STUDY_TABS.includes(tab as StudyTab) ? tab as StudyTab : "notes";
}
