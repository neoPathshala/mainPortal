import {facultyRegistryKey,parseFaculties,facultyLabel} from "./faculties";
import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {studySystem,parseSubjectPlacement,subjectPlacementKey,subjectPlacementPrefix,type StudySystem,type SubjectPlacement} from './academic-structure';
import type {CatalogSnapshot} from './catalog';
export const readAcademicStructure=cache(async()=>{
 const rows=await db.platformObject.findMany({where:{OR:[{key:{startsWith:'course-structure:'}},{key:{startsWith:subjectPlacementPrefix}},{key:facultyRegistryKey}]},select:{key:true,body:true}});
 let faculties:ReturnType<typeof parseFaculties>=[];
 const systems=new Map<string,StudySystem>(),placements:SubjectPlacement[]=[];
 for(const row of rows)try{const value=JSON.parse(Buffer.from(row.body).toString());if(row.key===facultyRegistryKey)faculties=parseFaculties(value);else if(row.key.startsWith('course-structure:'))systems.set(row.key.slice('course-structure:'.length),studySystem(value.studySystem));else{const link=parseSubjectPlacement(value);if(link&&row.key===subjectPlacementKey(link.courseId,link.period,link.subjectId))placements.push(link);}}catch{}
 return {systems,placements,faculties};
});
export function applyAcademicStructure(snapshot:CatalogSnapshot,ids:{id:string;slug:string}[],structure:Awaited<ReturnType<typeof readAcademicStructure>>):CatalogSnapshot{
 const courseSlugs=new Map(ids.map(course=>[course.id,course.slug]));
 const facultyRecords=structure.faculties||[];
 const courses=snapshot.courses.map(course=>({...course,faculty:facultyLabel(course.faculty,facultyRecords),facultySlug:facultyRecords.find(f=>`faculty:${f.id}`===course.faculty)?.slug,studySystem:structure.systems.get(ids.find(item=>item.slug===course.slug)?.id||'')||'semester' as StudySystem}));
 const coursesBySlug=new Map(courses.map(course=>[course.slug,course]));
 const canonical=new Map(snapshot.subjects.map(subject=>[subject.id,subject]));
 const subjects=[...snapshot.subjects],seen=new Set(subjects.map(subject=>`${subject.courseSlug}:${subject.semester}:${subject.id}`));
 for(const link of structure.placements){
  const subject=canonical.get(link.subjectId),slug=courseSlugs.get(link.courseId),course=slug?coursesBySlug.get(slug):null;
  const sourceCourse=subject?coursesBySlug.get(subject.courseSlug):null;
  if(!subject||!sourceCourse||sourceCourse.comingSoon||!course||course.comingSoon||link.period>course.totalSemesters)continue;
  const key=`${course.slug}:${link.period}:${subject.id}`;if(seen.has(key))continue;seen.add(key);
  subjects.push({...subject,courseSlug:course.slug,semester:link.period});
 }
 const details=Object.fromEntries(Object.entries(snapshot.details).map(([slug,detail])=>[slug,detail.faculty?.startsWith("faculty:")?{...detail,faculty:facultyLabel(detail.faculty,facultyRecords)}:detail]));
 return {...snapshot,courses,subjects,details:Object.values(snapshot.details).some(detail=>detail.faculty?.startsWith("faculty:"))?details:snapshot.details};
}
