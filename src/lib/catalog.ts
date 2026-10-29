import {semesterSummary,semesterSummaryKey,type SemesterSummaryOverride} from './semester-summary';
import type { AcademicCourse } from "./courses-meta";
import type { CourseSubject, UniversityOption, CourseOption } from "./multi-course-data";
import type { CourseDetail, PYQSolution, PDFDocument, VideoLecture, ChapterResourceBundle } from "@/data/courses-db";
import type { Subject, Semester } from "./resources";
import { electiveSelectionError } from "./elective-policy";
export type CatalogSnapshot={courseIds?:{id:string;slug:string}[];semesterSummaries?:Record<string,SemesterSummaryOverride>;courses:AcademicCourse[];universities:UniversityOption[];subjects:(Subject & {courseSlug:string;code:string;creditHours:number;electiveGroup?:string;pastQuestionsCount:number})[];details:Record<string,CourseDetail>;questions:PYQSolution[];pdfs:PDFDocument[];videos:VideoLecture[]};
export const EMPTY_CATALOG:CatalogSnapshot={courses:[],universities:[],subjects:[],details:{},questions:[],pdfs:[],videos:[]};
export function buildCatalog(snapshot:CatalogSnapshot){
 const subjectsBySlug=new Map([...snapshot.subjects].reverse().map(subject=>[subject.slug,subject]));
 const placements=new Map(snapshot.subjects.map(subject=>[`${subject.courseSlug}:${subject.semester}:${subject.slug}`,subject]));
 const subjectsByCourseSemester=new Map<string,typeof snapshot.subjects>();
 for(const subject of snapshot.subjects){const key=`${subject.courseSlug}:${subject.semester}`;const group=subjectsByCourseSemester.get(key);if(group)group.push(subject);else subjectsByCourseSemester.set(key,[subject]);}
 function groupBySubject<T extends {subjectSlug:string}>(items:T[]){const groups=new Map<string,T[]>();for(const item of items){const group=groups.get(item.subjectSlug);if(group)group.push(item);else groups.set(item.subjectSlug,[item]);}return groups;}
 const questionsBySubject=groupBySubject(snapshot.questions),pdfsBySubject=groupBySubject(snapshot.pdfs),videosBySubject=groupBySubject(snapshot.videos);

 const ACADEMIC_COURSES=Object.fromEntries(snapshot.courses.map(course=>[course.slug,course]));
 const UNIVERSITIES=snapshot.universities;
 const COURSES:CourseOption[]=snapshot.courses.map(c=>({id:c.slug,slug:c.slug,name:c.name,shortName:c.shortName,faculty:c.faculty,studySystem:c.studySystem,totalSemesters:c.totalSemesters,defaultUniversity:UNIVERSITIES.find(u=>u.name===c.university)?.id||""}));
 const normalizeCourseId=(value?:string)=>value?.trim().toLowerCase().replace(/_/g,"-")||"";
 const getCourseBySlug=(slug:string)=>ACADEMIC_COURSES[normalizeCourseId(slug)];
 const resolveStudentCourse=(value:string)=>snapshot.courses.find(c=>[c.slug,c.name,c.shortName].some(x=>x.toLowerCase()===value.trim().toLowerCase()))||null;
 const getCurriculumSubjects=(course:string,semester=1)=>((subjectsByCourseSemester.get(`${normalizeCourseId(course)}:${semester}`)||[]).slice() as (CourseSubject & {electiveGroup?:string})[]);
 const COURSE_CURRICULUM:Record<string,Record<number,CourseSubject[]>>=Object.fromEntries(snapshot.courses.map(c=>[c.slug,Object.fromEntries(Array.from({length:c.totalSemesters},(_,i)=>[i+1,getCurriculumSubjects(c.slug,i+1)]))]));
 const SEMESTERS:Semester[]=Array.from({length:8},(_,i)=>({id:i+1,name:`Semester ${i+1}`,subjects:snapshot.subjects.filter(s=>s.semester===i+1)}));
 const getSemester=(id:number)=>SEMESTERS.find(s=>s.id===id);
 const getSubject=(slug:string)=>subjectsBySlug.get(slug);
 const resolveSubjectRoute=(course:string,semester:number,slug:string)=>{const subject=placements.get(`${course}:${semester}:${slug}`);return subject?{contentSlug:slug,fallback:subject}:null;};
 const electiveSubjects=(course:string,semester:number)=>getCurriculumSubjects(course,semester).filter(s=>s.isElective);
 const studentSubjects=(course:string,semester:number,selected:string[])=>getCurriculumSubjects(course,semester).filter(s=>!s.isElective||selected.includes(s.slug));
 const studentResourceHref=(course:string,semester:number|null)=>{const selected=resolveStudentCourse(course);return selected&&semester?`/resources?course=${selected.slug}&semester=${semester}`:"/student/profile?tab=details";};
 function registrationAcademics(value:unknown,semester:unknown,electives:unknown=[]){
  const course=typeof value==="string"?resolveStudentCourse(value):null;if(!course)return {valid:false as const,message:"Choose your course."};
  if(typeof semester!=="number"||!Number.isInteger(semester)||semester<1||semester>course.totalSemesters)return {valid:false as const,message:`Choose a ${course.studySystem==='year'?'year':'semester'} from your course.`};
  if(!Array.isArray(electives)||electives.length>20||electives.some(v=>typeof v!=="string"))return {valid:false as const,message:"Choose valid elective subjects."};
  const error=electives.length?electiveSelectionError(course.slug,semester,electives,electiveSubjects(course.slug,semester)):null;
  if(error)return {valid:false as const,message:error};return {valid:true as const,course,semester,electives:electives as string[]};
 }
 return {getSemesterSummary:(course:string,semester:number)=>semesterSummary(course,semester,getCurriculumSubjects(course,semester),snapshot.semesterSummaries?.[semesterSummaryKey(course,semester)]),snapshot,ACADEMIC_COURSES,COURSES,UNIVERSITIES,COURSE_CURRICULUM,SEMESTERS,normalizeCourseId,getCourseBySlug,resolveStudentCourse,getCurriculumSubjects,getSemester,getSubject,resolveSubjectRoute,electiveSubjects,studentSubjects,studentResourceHref,registrationAcademics,
 COURSES_DATABASE:snapshot.details,PYQ_DATABASE:snapshot.questions,PDF_DOCUMENTS_DATABASE:snapshot.pdfs,
 getCourseOption:(slug:string)=>COURSES.find(c=>c.slug===slug),getUniversityOption:(slug:string)=>UNIVERSITIES.find(u=>u.id===slug),
 getCourseDetail:(slug:string)=>snapshot.details[slug],getSubjectPYQs:(slug:string,year?:number,unit?:number)=>(questionsBySubject.get(slug)||[]).filter(q=>(!year||q.year===year)&&(!unit||q.unitId===unit||q.unitIds?.includes(unit))),
 getSubjectPDFs:(slug:string,type?:string)=>(pdfsBySubject.get(slug)||[]).filter(d=>(!type||type==="all"||d.type===type)),getSubjectVideos:(slug:string)=>(videosBySubject.get(slug)||[]).slice(),
 getChapterResources:(slug:string,unit?:number):ChapterResourceBundle=>({
 notes:(pdfsBySubject.get(slug)||[]).filter(doc=>doc.type==="notes"&&doc.unitId!==undefined&&(!unit||doc.unitId===unit)).map(doc=>({...doc,unitId:doc.unitId!,unitName:doc.unitName||""})),
 videos:(videosBySubject.get(slug)||[]).filter(video=>video.unitId!==undefined&&(!unit||video.unitId===unit)).map(video=>({...video,unitId:video.unitId!})),mcqs:[],solutions:[],formulae:[]})};
}
