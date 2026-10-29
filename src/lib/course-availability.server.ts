import 'server-only';
import {cache} from 'react';
import {db} from './db';
export const comingSoonCourses=cache(async()=>{
 // Existing courses stay in launch mode until an admin explicitly opens them.
 const [courses,rows]=await Promise.all([db.course.findMany({select:{id:true,slug:true}}),db.platformObject.findMany({where:{key:{startsWith:'course-availability:'}},select:{key:true,body:true}})]);
 const states=new Map(rows.map(row=>{try{return [row.key.slice('course-availability:'.length),JSON.parse(Buffer.from(row.body).toString()).comingSoon] as const;}catch{return [row.key.slice('course-availability:'.length),true] as const;}}));
 return courses.filter(course=>states.get(course.id)!==false);
});
export const comingSoonCourseIds=cache(async()=>(await comingSoonCourses()).map(course=>course.id));
export const courseUnavailable=cache(async(slug:string)=>{
 return (await comingSoonCourses()).some(course=>course.slug===(slug==='bsc-csit'?'csit':slug));
});

export const subjectCourseUnavailable=cache(async(slug:string)=>{const subject=await db.subject.findFirst({where:{slug},select:{courseId:true}});return !!subject&&(await comingSoonCourseIds()).includes(subject.courseId);});
