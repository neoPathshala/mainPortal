import "server-only";
import {db} from "@/lib/db";
import {linkedSubjectIds} from "./shared-subject-membership";
export async function savedElectives(userId:string,course:string,semester:number,client:Pick<typeof db,"studentElective"|"course"|"platformObject">=db):Promise<string[]>{
 const owner=await client.course.findUnique({where:{slug:course},select:{id:true,status:true}});
 if(!owner||owner.status!=="PUBLISHED")return [];
 const shared=await linkedSubjectIds(client,owner.id,semester);
 const selections=await client.studentElective.findMany({where:{userId,subject:{OR:[{courseId:owner.id,semesterId:semester},...(shared.length?[{id:{in:shared}}]:[])],course:{status:"PUBLISHED"},status:"PUBLISHED",isElective:true}},select:{subject:{select:{slug:true}}}});
 return selections.map(selection=>selection.subject.slug);
}
