import {validStudySelection} from "@/lib/study-routing";
import {parseSubjectTabs} from "@/lib/subject-tab-settings";
import { notFound, redirect } from "next/navigation";
import { getCatalog } from "@/lib/catalog.server";
import { SubjectClientView } from "@/components/subject/SubjectClientView";
import { parseSemesterSlug } from "@/lib/courses-meta";
import { normalizeStudyTab } from "@/lib/study-tabs";
import { semesterLabel } from "@/lib/semester-label";
type Props={params:Promise<{courseSlug:string;semesterSlug:string;subjectSlug:string;tab?:string;selection?:string}>;searchParams?:Promise<{tab?:string;exam?:string}>};
export async function generateMetadata({params}:Props){const p=await params;const catalog=await getCatalog(p.subjectSlug);const subject=catalog.getSubject(p.subjectSlug);return {title:subject?`${subject.name} · neoPathshala`:"Subject not found"};}
export default async function SubjectPage({params,searchParams}:Props){const p=await params;if(p.tab==='important'){const query=await searchParams;const suffix=new URLSearchParams(query?.tab?{tab:query.tab}:{});redirect(`/${p.courseSlug}/${p.semesterSlug}/${p.subjectSlug}/important-questions${suffix.size?'?'+suffix:''}`);}const catalog=await getCatalog(p.subjectSlug);const semester=parseSemesterSlug(p.semesterSlug);const resolved=semester?catalog.resolveSubjectRoute(p.courseSlug,semester,p.subjectSlug):null;if(!resolved||!semester)notFound();const subject=resolved.fallback;const query=await searchParams;
const routeCourse=catalog.getCourseBySlug(p.courseSlug);const originalDetail=catalog.getCourseDetail(subject.slug);const detail=originalDetail?{...originalDetail,semester,studySystem:routeCourse?.studySystem,programName:routeCourse?.name,universityName:routeCourse?.university,faculty:routeCourse?.faculty}:undefined;const tabs=detail?.studyTabs||parseSubjectTabs(detail?.optionalTabs);const tab=normalizeStudyTab(p.tab||query?.tab);
if(!tabs.visible[tab])notFound();
if(p.selection&&!validStudySelection(tab,p.selection,detail?.units||[],catalog.getSubjectPDFs(subject.slug),catalog.getSubjectPYQs(subject.slug)))notFound();
if(p.selection&&tab==='pyqs'&&query?.exam&&!catalog.getSubjectPYQs(subject.slug).some(question=>String(question.year)===p.selection&&question.examType===query.exam))notFound();
return <div className="min-h-screen bg-background pb-24"><SubjectClientView courseSlug={p.courseSlug} slug={subject.slug} subjectName={subject.name} subjectCode={subject.code} subjectCreditHours={subject.creditHours} semesterInfo={{id:semester,name:semesterLabel(semester,routeCourse)}} courseDetail={detail} pyqs={catalog.getSubjectPYQs(subject.slug)} pdfDocs={catalog.getSubjectPDFs(subject.slug)} videos={catalog.getSubjectVideos(subject.slug)} dbResources={subject.resources} initialTab={normalizeStudyTab(p.tab||query?.tab)}/></div>;}
