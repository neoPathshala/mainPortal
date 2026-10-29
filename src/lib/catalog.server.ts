import {readAcademicStructure,applyAcademicStructure} from "./academic-structure.server";
import {parseSubjectTabs} from "./subject-tab-settings";
import {readSemesterSummaries} from './semester-summary.server';
import {comingSoonCourseIds,comingSoonCourses} from './course-availability.server';
import {publicMediaLink,publicMediaValues} from './pdf-link-origin';
import {requireStudyAccess} from "./study-access.server";
import {readPartitionJSON} from './partition-cache';
import {syllabusKey,publishedSyllabus} from "./syllabus";
import {coursePaperFormat} from "./paper-sections";
import { buildQuestionSolution } from "./question-solutions";
import { chapterSettings, chapterVisible, contentMetadataKey, parseContentMetadata } from "./content-metadata";
import { courseOrderKey,parseCourseOrder,orderCourses,compareSubjectCodes } from "./catalog-order";
import "server-only";
import { cache } from "react";
import { db } from "./db";
import { buildCatalog, type CatalogSnapshot } from "./catalog";
import type { CourseDetail, PDFDocument, PYQSolution, VideoLecture } from "@/data/courses-db";
export const getCatalogSnapshot=cache(async(subjectSlug?:string):Promise<CatalogSnapshot>=>{
 await requireStudyAccess();
 const unavailable=await comingSoonCourseIds();
 const [records,savedOrder]=await Promise.all([db.course.findMany({where:{status:"PUBLISHED",id:{notIn:unavailable}},include:{university:true,subjects:{where:{status:"PUBLISHED",...(subjectSlug?{slug:subjectSlug}:{})},include:{resources:{where:{status:"PUBLISHED"}},units:{where:{status:"PUBLISHED"},orderBy:{number:"asc"}},questions:{where:{status:"PUBLISHED"}}},orderBy:{name:"asc"}}},orderBy:{name:"asc"}}),db.platformObject.findUnique({where:{key:courseOrderKey},select:{body:true}})]);
 const rows=orderCourses(records,parseCourseOrder(savedOrder?.body));
 for(const course of rows)course.subjects.sort(compareSubjectCodes);
 const metadataKeys=rows.flatMap(course=>course.subjects.flatMap(subject=>[...(subjectSlug?[syllabusKey(subject.id)]:[]),`subject-tabs:${subject.id}`,`video-heading:${subject.id}`,...subject.units.map(unit=>contentMetadataKey("units",unit.id)),...subject.resources.map(resource=>contentMetadataKey("resources",resource.id)),...subject.questions.map(question=>contentMetadataKey("questions",question.id))]));
 const metadata=metadataKeys.length?await db.platformObject.findMany({where:{OR:[{key:{in:metadataKeys}},...rows.flatMap(course=>course.subjects.map(subject=>({key:{startsWith:`question-bank-year:${subject.id}:`}})))]},select:{key:true,body:true}}):[];
 const metadataMap=new Map(metadata.map(item=>[item.key,parseContentMetadata(item.body)]));
 const paperHeadersBySubject=new Map<string,Record<string,Record<string,string>>>();
 for(const item of metadata){const match=/^question-bank-year:([^:]+):(.+)$/.exec(item.key);if(!match)continue;let headers=paperHeadersBySubject.get(match[1]);if(!headers){headers={};paperHeadersBySubject.set(match[1],headers);}headers[match[2]]=metadataMap.get(item.key) as Record<string,string>;}
 const details:Record<string,CourseDetail>={};const questions:PYQSolution[]=[];const pdfs:PDFDocument[]=[];const videos:VideoLecture[]=[];
 const subjects=rows.flatMap(course=>course.subjects.map(subject=>{
  const optional=metadataMap.get(`subject-tabs:${subject.id}`)||{};
  const optionalTabs={practical:optional.practical===true,viva:optional.viva===true};
  const heading=metadataMap.get(`video-heading:${subject.id}`)?.title;
  const oneShotTitle=typeof heading==='string'&&heading.trim()?heading:'One-shot videos';
  const settingsFor=(id:string)=>chapterSettings(metadataMap.get(contentMetadataKey("units",id)));
  const chaptersById=new Map(subject.units.map(unit=>[unit.id,unit]));
  const chapterFor=(id:string|null)=>id?chaptersById.get(id):undefined;
  const resources=subject.resources.map(resource=>({...resource,url:publicMediaLink(resource.url)})).filter(resource=>(!(["practical","viva"].includes(resource.type))||optionalTabs[resource.type as "practical"|"viva"])&&(!resource.unitId||(chapterFor(resource.unitId)&&chapterVisible(settingsFor(resource.unitId),resource.type))));
  const paperHeaders=paperHeadersBySubject.get(subject.id)||{};
  details[subject.slug]={syllabus:publishedSyllabus(metadataMap.get(syllabusKey(subject.id))),paperFormat:coursePaperFormat(course),paperHeaders,universityName:course.university.name,programName:course.name,faculty:course.faculty,optionalTabs,studyTabs:parseSubjectTabs(optional),slug:subject.slug,name:subject.name,code:subject.code,creditHours:subject.creditHours,lectureHours:subject.lectureHours,semester:subject.semesterId||1,nature:"Theory Only",fullMarks:{theory:0,practical:0,passMarks:0},description:subject.description||"",objectives:[],units:subject.units.map(u=>({id:u.number,unitNumber:u.number,title:u.title,slug:typeof metadataMap.get(contentMetadataKey("units",u.id))?.chapterSlug==="string"?String(metadataMap.get(contentMetadataKey("units",u.id))?.chapterSlug):undefined,hours:u.hours,weightage:0,topics:u.topics,tags:settingsFor(u.id).tags,hiddenResourceTypes:["notes","videos","books","papers","practical","viva","syllabus","questions"].filter(type=>!chapterVisible(settingsFor(u.id),type))})),textbooks:[],references:[]};
  for(const q of subject.questions)questions.push(buildQuestionSolution(q,subject.slug,publicMediaValues(metadataMap.get(contentMetadataKey("questions",q.id))),subject.units));
  for(const r of resources){
   const unit=chapterFor(r.unitId);const info=metadataMap.get(contentMetadataKey("resources",r.id))||{};
   const unitName=unit?`Chapter ${unit.number}: ${unit.title}`:"";
   if(r.type==="videos")videos.push({id:r.id,subjectSlug:subject.slug,title:r.title,videoUrl:r.url,thumbnailUrl:typeof info.thumbnailUrl==="string"?info.thumbnailUrl:undefined,estimatedMarks:typeof info.estimatedMarks==="number"?info.estimatedMarks:undefined,duration:typeof info.duration==="string"?info.duration:"",instructor:r.author||"",unitName:info.videoKind==="One shot"?oneShotTitle:unitName,unitId:unit?.number,tags:unit?settingsFor(unit.id).tags:[],kind:["Lesson","One shot","Playlist"].includes(String(info.videoKind))?String(info.videoKind):"Lesson",description:typeof info.description==="string"?info.description:"",order:typeof info.videoOrder==="number"?info.videoOrder:unit?.number||0});
   else if(["books","notes","papers","practical","viva","syllabus"].includes(r.type))pdfs.push({id:r.id,subjectSlug:subject.slug,title:r.title,type:r.type as PDFDocument["type"],author:r.author||"",pages:typeof info.pages==="number"?info.pages:0,fileSize:"",downloadUrl:r.url,unitId:unit?.number,unitName,description:typeof info.description==="string"?info.description:""});
  }
  return {id:subject.id,slug:subject.slug,name:subject.name,semester:subject.semesterId||1,description:subject.description||"",isElective:subject.isElective,electiveGroup:subject.electiveGroup||undefined,code:subject.code,creditHours:subject.creditHours,courseSlug:course.slug,pastQuestionsCount:subject.questions.length,resources:resources.map(r=>({id:r.id,title:r.title,type:r.type,url:r.url,author:r.author||undefined,unitId:chapterFor(r.unitId)?.number}))};
 }));
 const universityMap=new Map(rows.map(c=>[c.university.id,{id:c.university.slug,name:c.university.name,shortName:c.university.shortName}]));
 const result:CatalogSnapshot={semesterSummaries:await readSemesterSummaries(),courses:rows.map(c=>({slug:c.slug,name:c.name,shortName:c.shortName,university:c.university.name,faculty:c.faculty,totalSemesters:c.totalSemesters,totalCredits:c.totalCredits,tagline:"",description:c.description,seoKeywords:[]})),universities:[...universityMap.values()],subjects,details,questions,pdfs,videos};
 return applyAcademicStructure(result,rows,await readAcademicStructure());
});
export const getCatalog=cache(async(subjectSlug?:string)=>buildCatalog(await getCatalogSnapshot(subjectSlug)));

// Shared navigation never needs question answers, chapter topics or media metadata.
// Public metadata has a short cache; availability and academic links stay request-fresh.
export const getNavigationCatalogSnapshot=cache(async()=>{const [unavailable,snapshot,summaries,structure]=await Promise.all([comingSoonCourses(),readPartitionJSON('catalog','navigation-academic-v2',async():Promise<CatalogSnapshot>=>{
 const [records,savedOrder]=await Promise.all([
  db.course.findMany({where:{status:'PUBLISHED'},select:{id:true,slug:true,name:true,shortName:true,faculty:true,totalSemesters:true,totalCredits:true,description:true,university:{select:{id:true,slug:true,name:true,shortName:true}},subjects:{where:{status:'PUBLISHED'},select:{id:true,slug:true,name:true,semesterId:true,description:true,isElective:true,electiveGroup:true,code:true,creditHours:true,_count:{select:{questions:{where:{status:'PUBLISHED'}}}}},orderBy:{name:'asc'}}},orderBy:{name:'asc'}}),
  db.platformObject.findUnique({where:{key:courseOrderKey},select:{body:true}}),
 ]);
 const rows=orderCourses(records,parseCourseOrder(savedOrder?.body));
 const universityMap=new Map(rows.map(c=>[c.university.id,{id:c.university.slug,name:c.university.name,shortName:c.university.shortName}]));
 const result:CatalogSnapshot={
  courses:rows.map(c=>({slug:c.slug,name:c.name,shortName:c.shortName,university:c.university.name,faculty:c.faculty,totalSemesters:c.totalSemesters,totalCredits:c.totalCredits,tagline:'',description:c.description,seoKeywords:[]})),
  universities:[...universityMap.values()],
  subjects:rows.flatMap(course=>[...course.subjects].sort(compareSubjectCodes).map(subject=>({id:subject.id,slug:subject.slug,name:subject.name,semester:subject.semesterId||1,description:subject.description||'',isElective:subject.isElective,electiveGroup:subject.electiveGroup||undefined,code:subject.code,creditHours:subject.creditHours,courseSlug:course.slug,pastQuestionsCount:subject._count.questions,resources:[]}))),
  details:{},questions:[],pdfs:[],videos:[],
 };
 return {...result,courseIds:rows.map(course=>({id:course.id,slug:course.slug}))};
}),readSemesterSummaries(),readAcademicStructure()]);
 // Availability is read outside persistent navigation caching so access changes apply immediately.
 const lockedSlugs=new Set(unavailable.map(course=>course.slug));
 const live={...snapshot,semesterSummaries:summaries,courses:snapshot.courses.map(course=>({...course,comingSoon:lockedSlugs.has(course.slug)})),subjects:snapshot.subjects.filter(subject=>!lockedSlugs.has(subject.courseSlug))};
 return applyAcademicStructure(live,snapshot.courseIds||[],structure);
});
export const getNavigationCatalog=cache(async()=>buildCatalog(await getNavigationCatalogSnapshot()));
