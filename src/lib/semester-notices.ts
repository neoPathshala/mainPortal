export type SemesterNotice = {
  tags?: string[]; targetCourseSlug?: string;
  id: string; title: string; content: string; category: string;
  attachmentUrl?: string; attachmentName?: string; attachmentSize?: string; externalLink?: string;
  targetSemester?: number | null; targetSemesters?: number[];
  published: boolean; targetPortal: string; status?: string;
  isPinned?: boolean; publishedAt: string; createdAt?: string;
};
export function noticesForSemester(notices: SemesterNotice[], semester: number | null, courseSlug?: string) {
  return notices.filter((notice) => {
    if (notice.targetCourseSlug && notice.targetCourseSlug !== courseSlug) return false;
    if (!notice.published || !["all", "neopathshala"].includes(notice.targetPortal) || (notice.status !== undefined && notice.status !== "PUBLISHED")) return false;
    const targets = Array.isArray(notice.targetSemesters) && notice.targetSemesters.length ? notice.targetSemesters : notice.targetSemester ? [notice.targetSemester] : [];
    return !targets.length || (semester !== null && targets.includes(semester));
  }).sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned) || (b.createdAt || "").localeCompare(a.createdAt || ""));
}
