import {courseUnavailable} from './course-availability.server';
import 'server-only';
import {cache} from 'react';
import {z} from 'zod';
import {db} from './db';
const schema=z.object({version:z.literal(1),published:z.boolean()}).strict();
export const publishedCourseSyllabus=cache(async(slug:string)=>{
 if(await courseUnavailable(slug))return null;
 const course=await db.course.findFirst({where:{slug,status:'PUBLISHED'},select:{id:true}});
 if(!course)return null;
 const record=await db.platformObject.findUnique({where:{key:`course-syllabus:${course.id}`},select:{body:true}});
 if(!record)return null;
 let metadata;try{metadata=schema.safeParse(JSON.parse(Buffer.from(record.body).toString()));}catch{return null;}
 if(!metadata.success||!metadata.data.published)return null;
 const file=await db.platformObject.findUnique({where:{key:`course-syllabus-file:${course.id}`},select:{key:true}});
 return file?{href:`/api/course-syllabus/${encodeURIComponent(slug)}`} : null;
});
