/** Launch gate for all student course content. Admin authoring stays available. */
export const coursesComingSoon = false;
export function isCourseStudyAPI(pathname: string) {
  return /^\/api\/(?:pdf|pdf-link|course-syllabus|subject-exam|study-metadata|important-questions|discussions)(?:\/|$)/.test(pathname)
    || /^\/(?:resources|uploads)\/.*\.pdf$/i.test(pathname);
}
