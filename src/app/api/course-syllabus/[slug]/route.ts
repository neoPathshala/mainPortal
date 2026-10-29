import {publishedCourseSyllabus} from '@/lib/course-syllabus.server';
import {db} from '@/lib/db';
import {canReadStudyResources} from '@/lib/study-access.server';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120)return new Response('Not found',{status:404});
 if(!await canReadStudyResources())return new Response('Sign in to download the syllabus.',{status:401,headers:{'Cache-Control':'private, no-store'}});
 if(!await publishedCourseSyllabus(slug))return new Response('Not found',{status:404});
 const course=await db.course.findUnique({where:{slug},select:{id:true}});
 const file=course?await db.platformObject.findUnique({where:{key:`course-syllabus-file:${course.id}`},select:{body:true}}):null;
 if(!file)return new Response('Not found',{status:404});
 return new Response(new Uint8Array(file.body),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${slug}-syllabus.pdf"`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"sandbox; default-src 'none'"}});
}
