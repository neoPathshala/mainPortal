import 'server-only';
import type {Prisma} from '@prisma/client';
import {parseSubjectPlacement,subjectPlacementKey,subjectPlacementPrefix} from '../academic-structure';
export async function linkedSubjectIds(client:Pick<Prisma.TransactionClient,'platformObject'>,courseId:string,period:number|null){
 if(period===null)return [];
 const rows=await client.platformObject.findMany({where:{key:{startsWith:`${subjectPlacementPrefix}${courseId}:${period}:`}},select:{key:true,body:true}});
 return rows.flatMap(row=>{try{const link=parseSubjectPlacement(JSON.parse(Buffer.from(row.body).toString()));return link&&link.courseId===courseId&&link.period===period&&row.key===subjectPlacementKey(courseId,period,link.subjectId)?[link.subjectId]:[];}catch{return [];}});
}
