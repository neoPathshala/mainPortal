import {periodSlug} from "@/lib/academic-structure";
import {isReleasedLink,RELEASE_FEATURES} from './release-features';
import {managedSiteLinks} from './site-pages.server';
import {builtInPage} from './site-pages';
import {articleSitemapPaths} from "./articles.server";
import { getNavigationCatalog } from "./catalog.server";

export const publicPages = [
  {label:"Articles",href:"/articles"}, { label: "Home", href: "/" }, { label: "Resources", href: "/resources" }, { label: "Courses", href: "/courses" }, { label: "Notices", href: "/notices" },
  { label: "Ask a question", href: "/ask-question" }, { label: "Contribute assets", href: "/contribute-assets" }, { label: "Contact us", href: "/contact" },
  { label: "Support Us", href: "/support-us" }, { label: "Feedback", href: "/feedback" },
  { label: "Privacy Policy", href: "/privacy-policy" }, { label: "Terms", href: "/terms" }, { label: "Cookies", href: "/cookies" }, { label: "Sitemap", href: "/sitemap" },
];
export async function visiblePublicPages(){return [...publicPages.filter(page=>!builtInPage(page.href.slice(1))),...await managedSiteLinks()].filter(page=>isReleasedLink(page.href));}
export async function studyMap() {
 const {ACADEMIC_COURSES,getCurriculumSubjects}=await getNavigationCatalog();
  return Object.values(ACADEMIC_COURSES).map(course => ({ ...course, href: `/${course.slug}`, semesters: Array.from({ length: course.totalSemesters }, (_, i) => {
    const number = i + 1, href = `/${course.slug}/${periodSlug(number,course)}`;
    return { number, href, subjects: getCurriculumSubjects(course.slug, number).map(subject => ({ label: subject.name, code: subject.code, href: `${href}/${subject.slug}` })) };
  }) }));
}
export async function sitemapPaths() {
  return [...new Set([...(await visiblePublicPages()).filter(page=>page.href!=="/notices").map(page => page.href), ...(RELEASE_FEATURES.blogs?await articleSitemapPaths():[]), ...(await studyMap()).flatMap(course => [course.href, ...course.semesters.flatMap(semester => [semester.href, ...semester.subjects.map(subject => subject.href)])])])];
}
