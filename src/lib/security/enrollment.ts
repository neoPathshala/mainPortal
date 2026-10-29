import "server-only";
import {linkedSubjectIds} from "./shared-subject-membership";
import type { Prisma } from "@prisma/client";
export async function saveEnrollment(tx:Prisma.TransactionClient,userId:string,courseSlug:string,semester:number|null,electives:string[]){
 const course=await tx.course.findUnique({where:{slug:courseSlug},select:{id:true,totalSemesters:true,status:true}});
 if(!course||course.status!=="PUBLISHED"||(semester!==null&&(semester<1||semester>course.totalSemesters)))throw new Error("Course unavailable.");
 if(semester!==null)await tx.studentEnrollment.upsert({where:{userId_courseId:{userId,courseId:course.id}},create:{userId,courseId:course.id,semester},update:{semester}});
 const shared=await linkedSubjectIds(tx,course.id,semester);
 const membership={OR:[{courseId:course.id,semesterId:semester},...(shared.length?[{id:{in:shared}}]:[])]};
 const subjects=await tx.subject.findMany({where:{...membership,isElective:true,status:"PUBLISHED",course:{status:"PUBLISHED"},slug:{in:electives}},select:{id:true}});
 if(subjects.length!==new Set(electives).size)throw new Error("Electives unavailable.");
 await tx.studentElective.deleteMany({where:{userId,subject:membership}});
 if(subjects.length)await tx.studentElective.createMany({data:subjects.map(subject=>({userId,subjectId:subject.id})),skipDuplicates:true});
}
