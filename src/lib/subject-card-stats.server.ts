import "server-only";
import { cache } from "react";
import { createHash } from "node:crypto";
import { db } from "./db";
import { listContent } from "@/lib/platform/content";
import { validStudyGuidance, type SubjectCardStatsIndex } from "./subject-card-stats";
export const getSubjectCardStats=cache(async():Promise<SubjectCardStatsIndex>=>{
 const subjects=await db.subject.findMany({where:{status:"PUBLISHED",course:{status:"PUBLISHED"}},select:{slug:true,_count:{select:{units:{where:{status:"PUBLISHED"}}}}}});
 const result:SubjectCardStatsIndex=Object.fromEntries(subjects.map(subject=>[subject.slug,{chapters:subject._count.units}]));
 try{const suffix=createHash("sha256").update("subject").digest("hex")+".json";for(const {key,value} of await listContent<{entity:string}>("content/study-metadata/",suffix)){const slug=key.split("/")[2];if(value?.entity==="subject"&&Object.hasOwn(result,slug))result[slug]={...result[slug],...validStudyGuidance(value)};}}catch{}
 return result;
});
