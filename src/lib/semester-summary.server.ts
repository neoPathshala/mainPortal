import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {parseSemesterSummary,type SemesterSummaryOverride} from './semester-summary';
export const readSemesterSummaries=cache(async()=>{
 const rows=await db.platformObject.findMany({where:{key:{startsWith:'semester-summary:'}},select:{key:true,body:true}});
 const result:Record<string,SemesterSummaryOverride>={};
 for(const row of rows){try{const value=parseSemesterSummary(JSON.parse(Buffer.from(row.body).toString()));if(value)result[row.key]=value;}catch{}}
 return result;
});
